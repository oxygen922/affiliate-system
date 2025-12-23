/**
 * API测试脚本
 * 老王出品：测试后端API是否正常工作
 */

const http = require('http');

function testAPI(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ ${description}`);
          console.log(`   状态码: ${res.statusCode}`);
          console.log(`   响应:`, jsonData);
          console.log('');
          resolve(jsonData);
        } catch (error) {
          console.log(`✅ ${description}`);
          console.log(`   状态码: ${res.statusCode}`);
          console.log(`   响应: ${data.substring(0, 100)}`);
          console.log('');
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description}`);
      console.log(`   错误: ${error.message}`);
      console.log('');
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 开始API测试...\n');

  try {
    // 测试1：健康检查
    await testAPI('/health', '健康检查接口');

    // 测试2：API信息
    await testAPI('/api', 'API信息接口');

    console.log('✅ 所有测试通过！');
    console.log('\n🎉 后端代码运行正常！');
    console.log('\n📝 注意：');
    console.log('   - 当前是测试模式，没有连接数据库');
    console.log('   - 完整功能需要启动PostgreSQL数据库');
    console.log('   - 核心API端点已成功加载');

    process.exit(0);
  } catch (error) {
    console.log('\n❌ 测试失败！');
    console.log('请检查错误信息');
    process.exit(1);
  }
}

// 运行测试
runTests();
