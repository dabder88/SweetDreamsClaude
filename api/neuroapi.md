 NeuroAPI предоставляет единый, OpenAI-совместимый API, который даёт вам доступ к десяткам AI моделей через один эндпоинт, автоматически обрабатывая резервные варианты и выбирая наиболее экономически эффективные опции. Начните работу за считанные минуты.
Для работы с NeuroAPI получите API-ключ в дашборде и передавайте его в заголовке Authorization как Bearer токен.
Способы взаимодействия

Вы можете использовать как официальные SDK от OpenAI, так и любую другую совместимую библиотеку:

OPENAI SDK:
from openai import OpenAI

client = OpenAI(
  base_url="https://neuroapi.host/v1",
  api_key="<NEUROAPI_API_KEY>",
)

completion = client.chat.completions.create(
  model="gpt-5-mini",
  messages=[
    {"role": "user", "content": "В чём смысл жизни?"}
  ]
)

print(completion.choices[0].message.content)

--------------

cURL:
Вы также можете обращаться к API напрямую через HTTP-запросы. Это полезно для быстрой проверки или в средах, где использование SDK невозможно. 

curl https://neuroapi.host/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <NEUROAPI_API_KEY>" \
  -d '{
    "model": "gpt-5-mini",
    "messages": [
      {
        "role": "user",
        "content": "В чём смысл жизни?"
      }
    ]
  }'

--------------

API Моделей
Скопировать

Ключевая информация для быстрого старта работы с основными функциями NeuroAPI. Наш API полностью совместим с OpenAI.
Генерация текста (Chat Completion)

Для генерации текста отправьте POST-запрос с историей сообщений.
POST /v1/chat/completions
Параметры запроса
Поле	Описание
model	Идентификатор модели
messages	Массив объектов с полями role ("user", "assistant" или "system") и content
temperature	Контролирует случайность вывода
tools	Список инструментов, которые может вызывать модель
tool_choice	Определяет, как модель будет использовать инструменты
stream	Установите true для получения ответа в виде потока (Server-Sent Events)
top_p	Выбор слов из самых вероятных
stop	Последовательность, при которой API прекратит генерацию токенов.
presence_penalty	Увеличивает вероятность появления новых тем
frequency_penalty	Увеличивает вероятность появления новых слов
seed	Целое число для получения воспроизводимых результатов
response_format	Указывает формат вывода, например, для получения JSON. {"type": "json_object"}

Пример запроса

Поле	Описание
model	Идентификатор модели (например, dall-e-3).
prompt	Текстовое описание изображения для генерации.
n	Количество изображений для генерации (по умолчанию 1).
size	Размер изображения (например, 1024x1024). Зависит от модели. 

Пример запроса

curl --location 'https://neuroapi.host/v1/images/generations' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
  "model": "dall-e-3",
  "prompt": "A cute cat playing with a ball of yarn",
  "n": 1,
  "size": "1024x1024"
}'

Особенности gpt-image-1

Модель gpt-image-1 использует тот же эндпоинт, что и другие модели для генерации изображений, но имеет свои особенности в параметрах. 

Ключевые поля запроса
Поле	Описание
model	Всегда gpt-image-1.
prompt	Текстовое описание изображения.
quality	Качество генерации. Доступные значения: low, medium, high. По умолчанию: auto.
size	Размер изображения. Доступные значения: 1024x1024, 1536x1024, 1024x1536. По умолчанию: auto. 

Пример запроса

curl --location 'https://neuroapi.host/v1/images/generations' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
  "model": "gpt-image-1",
  "prompt": "A beautiful landscape with mountains and a lake",
  "quality": "auto",
  "size": "auto"
}'
