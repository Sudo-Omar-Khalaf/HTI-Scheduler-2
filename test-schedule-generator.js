// Test the personalized schedule generator

const ExcelParserServiceFinal = require('./server/services/ExcelParserServiceFinal');
const ScheduleGeneratorService = require('./server/services/ScheduleGeneratorService');
const path = require('path');

async function testScheduleGenerator() {
  try {
    console.log('🧪 Testing personalized schedule generator...');
    
    // Parse Excel file first
    const parser = new ExcelParserServiceFinal();
    const excelFilePath = path.join(__dirname, 'الجداول الدراسية _ الفصل الدراسي الأول _ قسم الهندسة الكهربية (1).xlsx');
    
    console.log('📂 Parsing Excel file...');
    const parseResult = await parser.parseExcelFile(excelFilePath);
    
    console.log('📊 Parsed data summary:');
    console.log('- Course groups:', parseResult.course_groups.length);
    console.log('- Schedule entries:', parseResult.schedule_entries.length);
    
    // Test the schedule generator
    const generator = new ScheduleGeneratorService();
    
    // Test with a valid course selection using available groups
    const userRequest = {
      desired_courses: ['EEC 11301', 'EEC 10105'] // Using available groups: EEC 113 group 01, EEC 101 group 05
    };
    
    console.log('\n🎯 Testing with courses:', userRequest.desired_courses);
    
    const result = await generator.generatePersonalizedSchedule(
      parseResult.course_groups,
      userRequest
    );
    
    console.log('\n📝 Generation result:');
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('Total spans:', result.schedule.generation_metadata.total_spans);
      console.log('Course selection count:', result.schedule.course_selection.length);
      console.log('Span validation errors:', result.schedule.span_validation.errors);
      
      // Show course selection details
      console.log('\n📚 Course selection details:');
      result.schedule.course_selection.forEach(course => {
        console.log(`- ${course.course_code} Group ${course.group_number}`);
      });
      
      // Show span validation
      console.log('\n🔍 Span validation:');
      result.schedule.span_validation.course_span_summary.forEach(summary => {
        console.log(`- ${summary.course_code}: ${summary.actual_spans}/${summary.expected_spans} spans (valid: ${summary.is_valid})`);
      });
    } else {
      console.log('Error:', result.error);
      if (result.validation_errors) {
        console.log('Validation errors:', result.validation_errors);
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testScheduleGenerator();
