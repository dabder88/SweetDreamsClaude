Примеры использования 

JavaScript: 

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: "sk-aitunnel-xxx", // Ключ из нашего сервиса
  baseURL: "https://api.aitunnel.ru/v1/",
});

const chatResult = await client.chat.completions.create({
  messages: [{ role: "user", content: "Скажи интересный факт" }],
  model: "deepseek-r1",
  max_tokens: 50000, // Старайтесь указывать для более точного расчёта цены
});
console.log(chatResult.choices[0]?.message);

-----------------

Python:
from openai import OpenAI

client = OpenAI(
    api_key="sk-aitunnel-xxx", # Ключ из нашего сервиса
    base_url="https://api.aitunnel.ru/v1/",
)

chat_result = client.chat.completions.create(
    messages=[{"role": "user", "content": "Скажи интересный факт"}],
    model="deepseek-r1",
    max_tokens=50000, # Старайтесь указывать для более точного расчёта цены
)
print(chat_result.choices[0].message)

-----------------

Go:

package main

import (
  "context"
  "fmt"
  "log"

  openai "github.com/sashabaranov/go-openai"
)

func main() {
  client := openai.NewClientWithConfig(openai.ClientConfig{
    APIKey:  "sk-aitunnel-xxx", // Ключ из нашего сервиса
    BaseURL: "https://api.aitunnel.ru/v1/",
  })

  // Базовый запрос
  chatResp, err := client.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
    Model:    "deepseek-r1",
    Messages: []openai.ChatCompletionMessage{{Role: "user", Content: "Скажи интересный факт"}},
    MaxTokens: 50000, // Старайтесь указывать для более точного расчёта цены
  })
  if err != nil {
    log.Fatal(err)
  }
  fmt.Println(chatResp.Choices[0].Message.Content)
}

-----------------

PHP:

<?php
$api_key = 'sk-aitunnel-xxx'; // Ключ из нашего сервиса
$api_url = 'https://api.aitunnel.ru/v1/chat/completions';

$data_chat = [
    'model' => 'deepseek-r1',
    'max_tokens' => 50000, // Старайтесь указывать для более точного расчёта цены
    'messages' => [
        [
            'role' => 'user',
            'content' => 'Скажи интересный факт'
        ]
    ]
];

$ch = curl_init($api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $api_key
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data_chat));

$response_chat = curl_exec($ch);
echo $response_chat;

-----------------

CURL:

curl https://api.aitunnel.ru/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer sk-aitunnel-xxx" \
    -d '{
      "model": "deepseek-r1",
      "max_tokens": 50000,
      "messages": [
        {
          "role": "user",
          "content": "Скажи интересный факт"
        }
      ]
    }'
