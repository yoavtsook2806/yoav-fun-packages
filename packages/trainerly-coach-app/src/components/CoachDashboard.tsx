import React, { useState, useEffect } from 'react';
import ProfileModal from './ProfileModal';

interface Coach {
  coachId: string;
  name: string;
  email: string;
  nickname: string;
  phone?: string;
  age?: number;
  createdAt: string;
  valid: boolean;
}

interface CoachDashboardProps {
  coachId: string;
  token: string;
  onLogout: () => void;
}

const CoachDashboard: React.FC<CoachDashboardProps> = ({ 
  coachId, 
  token, 
  onLogout 
}) => {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadCoachProfile();
  }, [coachId]);

  const loadCoachProfile = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API service call
      console.log('Loading coach profile for:', coachId);
      
      // Mock API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock coach data
      const mockCoach: Coach = {
        coachId,
        name: 'Demo Coach',
        email: 'demo@example.com',
        nickname: 'demo_coach',
        phone: '+972-50-123-4567',
        age: 35,
        createdAt: new Date().toISOString(),
        valid: true
      };
      
      setCoach(mockCoach);
    } catch (err: any) {
      setError(err.message || 'Failed to load coach profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedCoach: Coach) => {
    setCoach(updatedCoach);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading coach dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        gap: '20px'
      }}>
        <div style={{ color: '#dc3545', fontSize: '18px' }}>
          Error: {error}
        </div>
        <button
          onClick={loadCoachProfile}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!coach) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#dc3545'
      }}>
        Coach profile not found
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '30px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', color: '#333' }}>
            Welcome, {coach.name}!
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
            Coach Dashboard • @{coach.nickname}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Edit Profile
          </button>
          <button
            onClick={onLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Profile Summary */}
      <div style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        marginBottom: '30px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
          Your Profile
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              color: '#666', 
              marginBottom: '5px',
              fontWeight: '500'
            }}>
              Email
            </label>
            <div style={{ fontSize: '16px', color: '#333' }}>
              {coach.email}
            </div>
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              color: '#666', 
              marginBottom: '5px',
              fontWeight: '500'
            }}>
              Phone
            </label>
            <div style={{ fontSize: '16px', color: '#333' }}>
              {coach.phone || 'Not provided'}
            </div>
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              color: '#666', 
              marginBottom: '5px',
              fontWeight: '500'
            }}>
              Age
            </label>
            <div style={{ fontSize: '16px', color: '#333' }}>
              {coach.age || 'Not provided'}
            </div>
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              color: '#666', 
              marginBottom: '5px',
              fontWeight: '500'
            }}>
              Member Since
            </label>
            <div style={{ fontSize: '16px', color: '#333' }}>
              {new Date(coach.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Management Sections - Coming Soon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
            Manage Trainers
          </h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Add and manage your trainers
          </p>
          <button
            disabled
            style={{
              padding: '12px 24px',
              backgroundColor: '#e9ecef',
              color: '#6c757d',
              border: 'none',
              borderRadius: '6px',
              cursor: 'not-allowed',
              fontSize: '14px'
            }}
          >
            Coming Soon
          </button>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
            Manage Exercises
          </h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Create and edit exercise library
          </p>
          <button
            disabled
            style={{
              padding: '12px 24px',
              backgroundColor: '#e9ecef',
              color: '#6c757d',
              border: 'none',
              borderRadius: '6px',
              cursor: 'not-allowed',
              fontSize: '14px'
            }}
          >
            Coming Soon
          </button>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
            Training Plans
          </h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Create and assign training plans
          </p>
          <button
            disabled
            style={{
              padding: '12px 24px',
              backgroundColor: '#e9ecef',
              color: '#6c757d',
              border: 'none',
              borderRadius: '6px',
              cursor: 'not-allowed',
              fontSize: '14px'
            }}
          >
            Coming Soon
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        coach={coach}
        token={token}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default CoachDashboard;
