// Test script to verify copy indication works end-to-end
const API_BASE = 'https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev';

async function testCopyFlow() {
    console.log('🧪 Testing copy indication flow...');
    
    // 1. Create a test coach
    const testCoach = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPass123!',
        nickname: `testcoach${Date.now()}`,
        firstName: 'Test',
        lastName: 'Coach'
    };
    
    try {
        // Register coach
        console.log('1. Registering test coach...');
        const registerResponse = await fetch(`${API_BASE}/coaches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testCoach)
        });
        
        if (!registerResponse.ok) {
            throw new Error(`Registration failed: ${registerResponse.status}`);
        }
        
        const registerData = await registerResponse.json();
        console.log('✅ Coach registered:', registerData.coach.coachId);
        
        // Login to get token
        console.log('2. Logging in...');
        const loginResponse = await fetch(`${API_BASE}/auth/coach/login`, {
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
        console.log('✅ Logged in, got token');
        
        // Get admin exercises
        console.log('3. Getting admin exercises...');
        const adminResponse = await fetch(`${API_BASE}/admin/exercises`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const adminData = await adminResponse.json();
        console.log(`✅ Found ${adminData.items.length} admin exercises`);
        
        // Copy first admin exercise
        const firstAdmin = adminData.items[0];
        console.log(`4. Copying admin exercise: ${firstAdmin.name} (${firstAdmin.exerciseId})`);
        
        const copyResponse = await fetch(`${API_BASE}/coaches/${coachId}/exercises/copy-admin/${firstAdmin.exerciseId}`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: firstAdmin.name + ' (Copied)',
                muscleGroup: firstAdmin.muscleGroup,
                note: firstAdmin.note,
                link: firstAdmin.link
            })
        });
        
        const copiedExercise = await copyResponse.json();
        console.log('✅ Exercise copied:', copiedExercise.exerciseId);
        console.log('📋 originalExerciseId:', copiedExercise.originalExerciseId);
        
        // Get coach exercises to verify
        console.log('5. Verifying coach exercises...');
        const coachExercisesResponse = await fetch(`${API_BASE}/coaches/${coachId}/exercises`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const coachExercisesData = await coachExercisesResponse.json();
        
        const copiedExercises = coachExercisesData.items.filter(ex => ex.originalExerciseId);
        console.log(`✅ Found ${copiedExercises.length} copied exercises`);
        
        // Check if copy indication should work
        const copiedAdminIds = copiedExercises.map(ex => ex.originalExerciseId);
        const shouldShowAsCopied = copiedAdminIds.includes(firstAdmin.exerciseId);
        
        console.log('\n🎯 RESULTS:');
        console.log(`Admin exercise ID: ${firstAdmin.exerciseId}`);
        console.log(`Copied exercise originalExerciseId: ${copiedExercise.originalExerciseId}`);
        console.log(`Should show as copied: ${shouldShowAsCopied ? '✅ YES' : '❌ NO'}`);
        
        if (shouldShowAsCopied) {
            console.log('🎉 SUCCESS: Copy indication should work!');
        } else {
            console.log('❌ ISSUE: IDs don\'t match - copy indication won\'t work');
        }
        
        return {
            coachId,
            token,
            adminExerciseId: firstAdmin.exerciseId,
            copiedExerciseId: copiedExercise.exerciseId,
            originalExerciseId: copiedExercise.originalExerciseId,
            shouldWork: shouldShowAsCopied
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.testCopyFlow = testCopyFlow;
}

console.log('📋 Copy this into browser console and run: testCopyFlow()');
