JARVIS ANDROID MVP — VERSÃO 0.1

O QUE ESTA VERSÃO FAZ
- Interface responsiva para Android.
- Comandos digitados.
- Reconhecimento de voz quando o navegador oferece Web Speech API.
- Resposta falada com síntese de voz do navegador.
- Comandos locais de teste: hora, data, ajuda, apresentação e saudação.

LIMITAÇÕES IMPORTANTES
- Ainda NÃO está conectado a um modelo de IA.
- A voz masculina é aproximada usando a voz pt-BR disponível no aparelho/navegador; não há garantia de voz masculina em todos os Android.
- O reconhecimento de voz pode depender de internet e das permissões do navegador.
- O service worker exige hospedagem HTTPS ou localhost.
- A chave da OpenAI NÃO deve ser inserida neste site nem em arquivos JavaScript. A futura integração será feita por um backend seguro.

TESTE LOCAL
1. Extraia o ZIP.
2. Hospede os arquivos em um serviço HTTPS de site estático (por exemplo, GitHub Pages).
3. Abra o endereço no Chrome do Android.
4. Permita o uso do microfone.
5. Teste primeiro os botões de comandos e depois o microfone.

PRÓXIMA ETAPA
Criar um backend seguro para conectar a API de IA. Só fazer isso depois de decidir como configurar o faturamento e os limites de uso.
