const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjauuaxltcuojxgepfso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYXV1YXhsdGN1b2p4Z2VwZnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5Mjc4MjUsImV4cCI6MjA2ODUwMzgyNX0.lIWqka2FJl6hZooYhkQgM4MzwvBQzogGgpIl2vnZ0r8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('Testing authentication...');
  
  try {
    // Test student login
    const { data: studentData, error: studentError } = await supabase.auth.signInWithPassword({
      email: 'student@engageai.com',
      password: 'student123'
    });
    
    if (studentError) {
      console.log('Student login error:', studentError.message);
    } else {
      console.log('Student login successful:', studentData.user.email);
    }
    
    // Test moderator login
    const { data: moderatorData, error: moderatorError } = await supabase.auth.signInWithPassword({
      email: 'moderator@engageai.com',
      password: 'moderator123'
    });
    
    if (moderatorError) {
      console.log('Moderator login error:', moderatorError.message);
    } else {
      console.log('Moderator login successful:', moderatorData.user.email);
    }
    
    // Test admin login
    const { data: adminData, error: adminError } = await supabase.auth.signInWithPassword({
      email: 'admin@engageai.com',
      password: 'admin123'
    });
    
    if (adminError) {
      console.log('Admin login error:', adminError.message);
    } else {
      console.log('Admin login successful:', adminData.user.email);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuth(); 