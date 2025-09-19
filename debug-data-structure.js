// Debug script to understand data structure mismatch

const ExcelParserServiceFinal = require('./server/services/ExcelParserServiceFinal');
const path = require('path');

async function debugDataStructure() {
  try {
    console.log('🔍 Debugging data structure...');
    
    const parser = new ExcelParserServiceFinal();
    const excelFilePath = path.join(__dirname, 'الجداول الدراسية _ الفصل الدراسي الأول _ قسم الهندسة الكهربية (1).xlsx');
    
    console.log('📂 Parsing Excel file...');
    const result = await parser.parseExcelFile(excelFilePath);
    
    console.log('\n📊 Parser output structure:');
    console.log('Keys:', Object.keys(result));
    console.log('Course groups count:', result.course_groups?.length || 0);
    
    if (result.course_groups && result.course_groups.length > 0) {
      console.log('\n🎯 First course group structure:');
      console.log(JSON.stringify(result.course_groups[0], null, 2));
      
      console.log('\n📝 Sample of first 3 course groups:');
      result.course_groups.slice(0, 3).forEach((group, index) => {
        console.log(`\n--- Group ${index + 1} ---`);
        console.log('Course Code:', group.course_code);
        console.log('Group Code:', group.group_code);
        console.log('Has sessions:', !!group.sessions);
        console.log('Sessions count:', group.sessions?.length || 0);
        if (group.sessions && group.sessions.length > 0) {
          console.log('First session:', JSON.stringify(group.sessions[0], null, 2));
        }
      });
    }
    
    // Check schedule_entries structure too
    if (result.schedule_entries && result.schedule_entries.length > 0) {
      console.log('\n📋 First schedule entry structure:');
      console.log(JSON.stringify(result.schedule_entries[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugDataStructure();
