import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes
from flask import Flask, send_from_directory

# --- Настройки ---
TOKEN = "7270866677:AAF9ngV90Hj8rYWNlDJePT2Zx8o1EWov6gY"
WEBAPP_URL = "https://maximus9431.github.io/minigame/"  # URL вашей мини-игры (HTTPS!)

# --- Telegram Bot ---

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("Запустить игру 🐾", web_app=WebAppInfo(url=WEBAPP_URL))]
    ]
    await update.message.reply_text(
        "Привет! Нажми кнопку ниже, чтобы сыграть в Cat Clicker:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.run_polling()

# --- Flask сервер для отдачи мини-игры ---

flask_app = Flask(__name__)

@flask_app.route("/")
def index():
    return send_from_directory(".", "index.html")

@flask_app.route("/<path:path>")
def static_files(path):
    return send_from_directory(".", path)

if __name__ == "__main__":
    import threading
    # Запуск Flask в отдельном потоке
    threading.Thread(target=lambda: flask_app.run(host="0.0.0.0", port=8080), daemon=True).start()
    # Запуск Telegram-бота
    main()