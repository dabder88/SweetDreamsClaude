#!/usr/bin/env node

/**
 * AI Provider System - Setup Verification Script
 * Проверяет готовность системы AI провайдеров перед запуском
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка готовности AI Provider Management System...\n');

let errors = 0;
let warnings = 0;

// Функция проверки существования файла
function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}`);
    return true;
  } else {
    console.log(`❌ ${description} - ФАЙЛ НЕ НАЙДЕН: ${filePath}`);
    errors++;
    return false;
  }
}

// Функция проверки наличия зависимости в package.json
function checkDependency(depName) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  if (allDeps[depName]) {
    console.log(`✅ NPM зависимость: ${depName}@${allDeps[depName]}`);
    return true;
  } else {
    console.log(`❌ NPM зависимость отсутствует: ${depName}`);
    errors++;
    return false;
  }
}

// Функция проверки наличия строки в файле
function checkFileContains(filePath, searchString, description) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  ${description} - файл не найден: ${filePath}`);
    warnings++;
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(searchString)) {
    console.log(`✅ ${description}`);
    return true;
  } else {
    console.log(`⚠️  ${description} - не найдено в файле`);
    warnings++;
    return false;
  }
}

console.log('📦 Проверка NPM зависимостей:');
console.log('─'.repeat(50));
checkDependency('openai');
checkDependency('@anthropic-ai/sdk');
console.log('');

console.log('🗄️  Проверка SQL миграций:');
console.log('─'.repeat(50));
checkFile('supabase/migrations/20250129_create_ai_providers.sql', 'Миграция создания таблиц');
checkFile('supabase/migrations/20250129_seed_ai_providers.sql', 'Seed данные (TOP-20 моделей)');
console.log('');

console.log('🔧 Проверка Backend архитектуры:');
console.log('─'.repeat(50));
checkFile('services/ai/providers/BaseProvider.ts', 'BaseProvider - абстрактный класс');
checkFile('services/ai/providers/GeminiProvider.ts', 'GeminiProvider - адаптер для Gemini');
checkFile('services/ai/providers/OpenAIProvider.ts', 'OpenAIProvider - универсальный адаптер');
checkFile('services/ai/providers/ClaudeProvider.ts', 'ClaudeProvider - адаптер для Claude');
checkFile('services/ai/AIProviderFactory.ts', 'AIProviderFactory - фабрика');
checkFile('services/ai/aiService.ts', 'AIService - главный singleton сервис');
console.log('');

console.log('🎨 Проверка UI компонентов:');
console.log('─'.repeat(50));
checkFile('components/AIProviders.tsx', 'AIProviders UI компонент');
checkFileContains('components/AdminPanel.tsx', 'ai-providers', 'AdminPanel - интеграция AI Providers');
console.log('');

console.log('📘 Проверка TypeScript типов:');
console.log('─'.repeat(50));
checkFileContains('types.ts', 'AIProviderConfig', 'types.ts - AIProviderConfig интерфейс');
checkFileContains('types.ts', 'AIModel', 'types.ts - AIModel интерфейс');
checkFileContains('types.ts', 'AIProviderType', 'types.ts - AIProviderType тип');
console.log('');

console.log('🔌 Проверка Admin Service функций:');
console.log('─'.repeat(50));
checkFileContains('services/adminService.ts', 'getAllProviders', 'adminService - getAllProviders()');
checkFileContains('services/adminService.ts', 'setActiveProvider', 'adminService - setActiveProvider()');
checkFileContains('services/adminService.ts', 'testProviderConnection', 'adminService - testProviderConnection()');
console.log('');

console.log('📄 Проверка документации:');
console.log('─'.repeat(50));
checkFile('AI_PROVIDERS_SETUP.md', 'Инструкция по настройке');
checkFile('AI_PROVIDERS_STATUS.md', 'Статус реализации');
console.log('');

console.log('⚙️  Проверка переменных окружения:');
console.log('─'.repeat(50));
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');

  // Проверка существующих ключей
  if (envContent.includes('VITE_API_KEY')) {
    console.log('✅ VITE_API_KEY - найден');
  } else {
    console.log('⚠️  VITE_API_KEY - не найден (Gemini API key)');
    warnings++;
  }

  if (envContent.includes('VITE_SUPABASE_URL')) {
    console.log('✅ VITE_SUPABASE_URL - найден');
  } else {
    console.log('❌ VITE_SUPABASE_URL - не найден');
    errors++;
  }

  // Проверка новых ключей для AI провайдеров
  const newKeys = [
    'VITE_AITUNNEL_KEY',
    'VITE_NEUROAPI_KEY',
    'VITE_OPENAI_KEY',
    'VITE_CLAUDE_KEY'
  ];

  let foundNewKeys = 0;
  newKeys.forEach(key => {
    if (envContent.includes(key)) {
      console.log(`✅ ${key} - найден`);
      foundNewKeys++;
    } else {
      console.log(`⚠️  ${key} - не найден (опционально)`);
    }
  });

  if (foundNewKeys === 0) {
    console.log('⚠️  Внимание: Не найдено ни одного ключа для новых AI провайдеров');
    console.log('   Добавьте хотя бы один: VITE_AITUNNEL_KEY или VITE_NEUROAPI_KEY');
    warnings++;
  }
} else {
  console.log('❌ Файл .env не найден');
  errors++;
}
console.log('');

// Итоговый результат
console.log('═'.repeat(50));
console.log('📊 РЕЗУЛЬТАТ ПРОВЕРКИ:');
console.log('═'.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log('🎉 ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ!');
  console.log('✅ Система полностью готова к использованию');
  console.log('');
  console.log('📋 СЛЕДУЮЩИЕ ШАГИ:');
  console.log('  1. Выполните SQL миграции в Supabase Dashboard');
  console.log('  2. Добавьте API ключи в .env (если еще не добавлены)');
  console.log('  3. Запустите приложение: npm run dev');
  console.log('  4. Настройте провайдера в Админ-панели → AI Провайдеры');
  process.exit(0);
} else if (errors === 0) {
  console.log(`⚠️  ЕСТЬ ПРЕДУПРЕЖДЕНИЯ: ${warnings}`);
  console.log('✅ Критических ошибок нет, но рекомендуется проверить предупреждения');
  console.log('');
  console.log('📋 СЛЕДУЮЩИЕ ШАГИ:');
  console.log('  1. Проверьте предупреждения выше');
  console.log('  2. Выполните SQL миграции в Supabase Dashboard');
  console.log('  3. Добавьте недостающие API ключи в .env');
  console.log('  4. Запустите приложение: npm run dev');
  process.exit(0);
} else {
  console.log(`❌ ОБНАРУЖЕНЫ ОШИБКИ: ${errors}`);
  console.log(`⚠️  Предупреждения: ${warnings}`);
  console.log('');
  console.log('🔧 НЕОБХОДИМЫЕ ДЕЙСТВИЯ:');
  console.log('  1. Исправьте ошибки, указанные выше');
  console.log('  2. Убедитесь, что все файлы созданы');
  console.log('  3. Установите отсутствующие зависимости: npm install');
  console.log('  4. Запустите проверку снова: node check-ai-providers-setup.js');
  process.exit(1);
}
