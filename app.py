"""
Landing Page - Óleos Essenciais doTERRA · Fernanda Delgado
Backend Flask: recebe pedidos, salva no Google Sheets e dispara email.
"""

import os
import json
import uuid
import smtplib
import logging
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from flask import Flask, request, jsonify, send_from_directory, send_file
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

# Configuração de logs
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Inicializa Flask
app = Flask(__name__, static_folder='.', static_url_path='')


# ====================================================
# ROTAS — FRONTEND
# ====================================================
@app.route('/')
def index():
    return send_file('index.html')


@app.route('/<path:caminho>')
def static_files(caminho):
    if os.path.exists(caminho):
        return send_from_directory('.', caminho)
    return send_file('index.html')


# ====================================================
# CARREGAR CONFIG DOS PRODUTOS
# ====================================================
def carregar_config():
    try:
        with open('produtos.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f'Erro ao carregar produtos.json: {e}')
        return {}


# ====================================================
# GOOGLE SHEETS — SALVAR PEDIDO
# ====================================================
def salvar_no_sheets(pedido_id, dados):
    """Salva o pedido no Google Sheets. Retorna True/False."""
    try:
        import gspread
        from google.oauth2.service_account import Credentials

        creds_path = os.getenv('GOOGLE_CREDENTIALS_PATH', 'credentials.json')
        sheet_id = os.getenv('GOOGLE_SHEET_ID')

        if not os.path.exists(creds_path) or not sheet_id:
            logger.warning('Google Sheets não configurado (sem credentials.json ou SHEET_ID). Pulando.')
            return False

        scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ]
        creds = Credentials.from_service_account_file(creds_path, scopes=scopes)
        client = gspread.authorize(creds)
        sheet = client.open_by_key(sheet_id).sheet1

        # Cabeçalho (se a planilha estiver vazia)
        if not sheet.get_all_values():
            sheet.append_row([
                'Pedido ID', 'Data/Hora', 'Nome', 'Telefone',
                'CEP', 'Endereço Completo', 'Cidade', 'Estado',
                'Produtos', 'Valor Total', 'Status'
            ])

        produtos_texto = ' | '.join(
            f"{p['quantidade']}x {p['nome']} ({p['tamanho']})"
            for p in dados['produtos']
        )

        sheet.append_row([
            pedido_id,
            datetime.now().strftime('%d/%m/%Y %H:%M'),
            dados['nome'],
            dados['telefone'],
            dados['cep'],
            dados['endereco'],
            dados.get('cidade', ''),
            dados.get('estado', ''),
            produtos_texto,
            f"R$ {dados['valor_total']:.2f}".replace('.', ','),
            'Aguardando pagamento'
        ])

        logger.info(f'✅ Pedido {pedido_id} salvo no Google Sheets')
        return True

    except Exception as e:
        logger.error(f'❌ Erro ao salvar no Sheets: {e}')
        return False


# ====================================================
# GMAIL — ENVIAR ALERTA
# ====================================================
def enviar_email_alerta(pedido_id, dados):
    """Envia email de alerta pra Patricia com os dados do pedido."""
    try:
        email_remetente = os.getenv('GMAIL_USER')
        senha_app = os.getenv('GMAIL_APP_PASSWORD')
        email_destino = os.getenv('EMAIL_DESTINO', email_remetente)

        if not email_remetente or not senha_app:
            logger.warning('Gmail não configurado (sem GMAIL_USER ou GMAIL_APP_PASSWORD). Pulando.')
            return False

        # Monta HTML do email
        produtos_html = ''.join(f"""
            <tr>
                <td style="padding:8px; border-bottom:1px solid #E5DEC9;">{p['quantidade']}×</td>
                <td style="padding:8px; border-bottom:1px solid #E5DEC9;"><strong>{p['nome']}</strong> ({p['tamanho']})</td>
                <td style="padding:8px; border-bottom:1px solid #E5DEC9; text-align:right;">R$ {p['subtotal']:.2f}</td>
            </tr>
        """ for p in dados['produtos'])

        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: 'Helvetica', sans-serif; background:#F9F4E8; padding:20px; margin:0;">
            <div style="max-width:600px; margin:0 auto; background:white; border-radius:8px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
                <div style="background:#F4B840; padding:24px; text-align:center;">
                    <h1 style="margin:0; color:#3C4423; font-size:24px;">🌿 Novo pedido de óleos</h1>
                    <p style="margin:8px 0 0; color:#3C4423; opacity:0.8;">Pedido {pedido_id}</p>
                </div>

                <div style="padding:24px;">
                    <h2 style="color:#3C4423; font-size:18px; margin-top:0;">👤 Dados do cliente</h2>
                    <p style="margin:6px 0; color:#2A2A1F;"><strong>Nome:</strong> {dados['nome']}</p>
                    <p style="margin:6px 0; color:#2A2A1F;"><strong>Telefone:</strong> {dados['telefone']}</p>
                    <p style="margin:6px 0; color:#2A2A1F;"><strong>CEP:</strong> {dados['cep']}</p>
                    <p style="margin:6px 0; color:#2A2A1F;"><strong>Endereço:</strong> {dados['endereco']}</p>
                    <p style="margin:6px 0; color:#2A2A1F;"><strong>Cidade/UF:</strong> {dados.get('cidade', '')}/{dados.get('estado', '')}</p>

                    <h2 style="color:#3C4423; font-size:18px; margin-top:24px;">🛒 Pedido</h2>
                    <table style="width:100%; border-collapse:collapse; margin-top:8px;">
                        {produtos_html}
                        <tr>
                            <td colspan="2" style="padding:12px 8px; font-weight:700; color:#3C4423; border-top:2px solid #F4B840;">Total</td>
                            <td style="padding:12px 8px; text-align:right; font-weight:700; color:#D49B1F; font-size:18px; border-top:2px solid #F4B840;">
                                R$ {dados['valor_total']:.2f}
                            </td>
                        </tr>
                    </table>

                    <p style="margin-top:24px; padding:16px; background:#F9F4E8; border-radius:6px; color:#3C4423; font-size:14px;">
                        💡 <strong>Próximo passo:</strong> aguarde o comprovante no WhatsApp ({dados['telefone']}) e combine a entrega.
                    </p>
                </div>

                <div style="background:#3C4423; color:#F9F4E8; padding:16px; text-align:center; font-size:12px;">
                    Pedido recebido em {datetime.now().strftime('%d/%m/%Y às %H:%M')}
                </div>
            </div>
        </body>
        </html>
        """

        # Monta email
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'🌿 Novo pedido de óleos — {dados["nome"]}'
        msg['From'] = email_remetente
        msg['To'] = email_destino
        msg.attach(MIMEText(html, 'html', 'utf-8'))

        # Envia via Gmail SMTP
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as servidor:
            servidor.login(email_remetente, senha_app)
            servidor.send_message(msg)

        logger.info(f'✅ Email de alerta enviado pra {email_destino}')
        return True

    except Exception as e:
        logger.error(f'❌ Erro ao enviar email: {e}')
        return False


# ====================================================
# API — RECEBER PEDIDO
# ====================================================
@app.route('/api/pedido', methods=['POST'])
def receber_pedido():
    try:
        dados = request.get_json()

        # Validação básica
        campos_obrigatorios = ['nome', 'telefone', 'cep', 'endereco', 'produtos', 'valor_total']
        for campo in campos_obrigatorios:
            if not dados.get(campo):
                return jsonify({
                    'success': False,
                    'message': f'Campo obrigatório faltando: {campo}'
                }), 400

        if not dados['produtos'] or dados['valor_total'] <= 0:
            return jsonify({
                'success': False,
                'message': 'Carrinho vazio ou valor inválido'
            }), 400

        # Gera ID único do pedido
        pedido_id = 'FD-' + datetime.now().strftime('%Y%m%d') + '-' + uuid.uuid4().hex[:6].upper()

        # Salva no Google Sheets (se configurado)
        sheets_ok = salvar_no_sheets(pedido_id, dados)

        # Envia email de alerta (se configurado)
        email_ok = enviar_email_alerta(pedido_id, dados)

        return jsonify({
            'success': True,
            'pedido_id': pedido_id,
            'sheets_salvo': sheets_ok,
            'email_enviado': email_ok,
            'message': 'Pedido processado com sucesso'
        }), 200

    except Exception as e:
        logger.error(f'❌ Erro ao processar pedido: {e}')
        return jsonify({
            'success': False,
            'message': 'Erro interno ao processar pedido'
        }), 500


# ====================================================
# HEALTH CHECK
# ====================================================
@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})


# ====================================================
# MAIN
# ====================================================
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    logger.info(f'🚀 Landing Óleos rodando em http://localhost:{port}')
    app.run(host='0.0.0.0', port=port, debug=debug)
