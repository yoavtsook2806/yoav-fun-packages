// Simple test for copy indication
async function testCopy() {
    const API_BASE = 'https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev';
    
    // Create unique coach
    const timestamp = Date.now();
    const testCoach = {
        email: 'test' + timestamp + '@example.com',
        password: 'TestPass123!',
        nickname: 'testcoach' + timestamp,
        firstName: 'Test',
        lastName: 'Coach'
    };
    
    console.log('Creating test coach...');
    
    // Register
    const registerResponse = await fetch(API_BASE + '/coaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCoach)
    });
    
    const registerData = await registerResponse.json();
    console.log('Coach created:', registerData.coach.coachId);
    
    // Login
    const loginResponse = await fetch(API_BASE + '/auth/coach/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testCoach.email,
            password: testCoach.password
        })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    const coachId = registerData.coach.coachId;
    
    console.log('Logged in, token received');
    
    // Get admin exercises
    const adminResponse = await fetch(API_BASE + '/admin/exercises', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const adminData = await adminResponse.json();
    const firstAdmin = adminData.items[0];
    
    console.log('Admin exercise to copy:', firstAdmin.name, firstAdmin.exerciseId);
    
    // Copy exercise
    const copyResponse = await fetch(API_BASE + '/coaches/' + coachId + '/exercises/copy-admin/' + firstAdmin.exerciseId, {
        method: 'POST',
        headers: { 
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: firstAdmin.name + ' Copied',
            muscleGroup: firstAdmin.muscleGroup,
            note: firstAdmin.note,
            link: firstAdmin.link
        })
    });
    
    const copiedExercise = await copyResponse.json();
    console.log('Exercise copied. originalExerciseId:', copiedExercise.originalExerciseId);
    
    // Check if IDs match
    const idsMatch = copiedExercise.originalExerciseId === firstAdmin.exerciseId;
    console.log('IDs match:', idsMatch);
    console.log('Copy indication should work:', idsMatch ? 'YES' : 'NO');
    
    return {
        coachId: coachId,
        token: token,
        adminId: firstAdmin.exerciseId,
        copiedId: copiedExercise.exerciseId,
        originalId: copiedExercise.originalExerciseId,
        working: idsMatch
    };
}

// Run the test
testCopy().then(result => {
    console.log('Test completed:', result);
}).catch(error => {
    console.error('Test failed:', error);
});
