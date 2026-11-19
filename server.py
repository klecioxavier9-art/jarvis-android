
import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

CORS(app, origins=[
    "https://klecioxavier9-art.github.io"
])

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "openai/gpt-oss-120b"

SYSTEM_PROMPT = (
    "Você é JARVIS, um assistente pessoal inteligente e parceiro "
    "de desenvolvimento de projetos. Converse sempre em português brasileiro. "
    "Seja natural, educado, objetivo e atencioso. "
    "Ajude o usuário a planejar e desenvolver projetos completos, "
    "incluindo negócios, sites, aplicativos, sistemas e ferramentas digitais. "
    "Quando receber uma ideia, ajude a definir objetivos, funcionalidades, "
    "etapas, tecnologias, custos, riscos e próximos passos. "
    "Quando solicitado, escreva códigos completos e explique como utilizá-los. "
    "Nunca diga que executou, publicou ou salvou algo se isso não aconteceu. "
    "Não invente resultados de pesquisas ou ações externas. "
    "Em conversas comuns, responda normalmente em 1 a 4 frases. "
    "Em planejamentos e tarefas técnicas, forneça o nível de detalhe necessário. "
    "Evite tabelas e listas, exceto quando forem úteis ou solicitadas. "
    "Mantenha o contexto usando o histórico de mensagens recebido."
)

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
        return jsonify({
            "error": "Chave de IA não configurada"
        }), 500

    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"error": "Mensagem vazia"}), 400

    if len(message) > 4000:
        return jsonify({"error": "Mensagem muito longa"}), 400

    history = data.get("history", [])

    if not isinstance(history, list):
        return jsonify({"error": "Histórico inválido"}), 400

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        }
    ]

    for item in history[-12:]:
        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = item.get("content")

        if (
            role in ("user", "assistant")
            and isinstance(content, str)
            and content.strip()
        ):
            messages.append({
                "role": role,
                "content": content[:4000]
            })

    messages.append({
        "role": "user",
        "content": message
    })

    payload = {
        "model": MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1200
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
        return jsonify({
            "error": "Não foi possível conectar à IA"
        }), 502

    except (KeyError, ValueError, TypeError):
        return jsonify({
            "error": "Resposta inválida da IA"
        }), 502


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 10000))
    )
