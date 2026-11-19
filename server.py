

import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

CORS(app, origins=[
    "https://klecioxavier9-art.github.io"
])

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "online",
        "assistant": "JARVIS"
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/chat", methods=["POST"])
def chat():
    api_key = os.environ.get("GROQ_API_KEY")

    if not api_key:
        return jsonify({"error": "Chave de IA não configurada"}), 500

    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"error": "Mensagem vazia"}), 400

    if len(message) > 4000:
        return jsonify({"error": "Mensagem muito longa"}), 400

    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Você é JARVIS, um assistente pessoal inteligente, "
                    "educado, objetivo e tecnológico. Responda sempre "
                    "em português brasileiro, com clareza e naturalidade."
                )
            },
            {
                "role": "user",
                "content": message
            }
        ],
        "temperature": 0.7,
        "max_tokens": 800
    }

    try:
        response = requests.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=45
        )

        result = response.json()

        if response.status_code != 200:
            return jsonify({
                "error": result.get("error", {}).get(
                    "message", "Erro na IA"
                )
            }), response.status_code

        answer = result["choices"][0]["message"]["content"]

        return jsonify({"reply": answer})

    except requests.RequestException:
        return jsonify({"error": "Não foi possível conectar à IA"}), 502

    except (KeyError, ValueError, TypeError):
        return jsonify({"error": "Resposta inválida da IA"}), 502


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
