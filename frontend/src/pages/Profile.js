import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { TextInput, PasswordInput, Button, InlineNotification } from '@carbon/react';
import { Edit, Save, Close } from '@carbon/icons-react';
import { updateProfile, getProfile } from '../services/api';
import { loginSuccess } from '../store/authSlice';
import Header from '../components/Header';
import './Profile.scss';

/**
 * Profile page component.
 * Allows users to view and update their profile.
 */
const Profile = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [displayAvatar, setDisplayAvatar] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
        try {
            const response = await getProfile();
            const data = response.data;
            setDisplayName(data.display_name || '');
            setEmail(data.email || '');
            setAvatar(data.avatar || '');
            setDisplayAvatar(data.avatar || '');

            if (user) {
                 dispatch(loginSuccess({
                     user: { ...user, ...data, displayName: data.display_name },
                     token
                 }));
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
        }
    };

    fetchProfile();
    // eslint-disable-next-line
  }, [token, navigate, dispatch]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        setDisplayAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const updatedData = {
        display_name: displayName,
        avatar: avatar,
      };

      if (password) {
        updatedData.password = password;
      }

      const response = await updateProfile(updatedData);

      const updatedUser = {
        ...user,
        displayName: response.data.display_name,
        avatar: response.data.avatar,
      };

      dispatch(loginSuccess({ user: updatedUser, token: token }));
      setMessage('Profile updated successfully!');
      setPassword('');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError('Failed to update profile.');
    }
  };

  const toggleEdit = () => {
      setIsEditing(!isEditing);
      setMessage('');
      setError('');
  };

  return (
    <div className="layout">
      <Header />
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
             <h2>My Profile</h2>
          </div>
        
          {message && <InlineNotification kind="success" title="Success" subtitle={message} hideCloseButton />}
          {error && <InlineNotification kind="error" title="Error" subtitle={error} hideCloseButton />}

          {!isEditing ? (
              <div className="profile-view">
                  <div className="avatar-section">
                      <div className="avatar-display">
                          {displayAvatar ? (
                              <img src={displayAvatar} alt="Avatar" />
                          ) : (
                              <div className="avatar-placeholder">
                                  <span>{displayName ? displayName.charAt(0).toUpperCase() : 'U'}</span>
                              </div>
                          )}
                      </div>
                  </div>
                  
                  <div className="info-section">
                      <div className="info-group">
                          <label>Display Name</label>
                          <div className="value">{displayName || 'Not set'}</div>
                      </div>
                      <div className="info-group">
                          <label>Email</label>
                          <div className="value">{email}</div>
                      </div>
                  </div>

                  <div className="action-section">
                      <Button renderIcon={Edit} onClick={toggleEdit}>Edit Profile</Button>
                  </div>
              </div>
          ) : (
              <form onSubmit={handleSubmit} className="profile-edit-form">
                  <div className="form-group avatar-upload-group">
                      <label>Profile Picture</label>
                      <div className="avatar-upload-container">
                          <div className="avatar-preview">
                              {displayAvatar ? (
                                  <img src={displayAvatar} alt="Avatar Preview" />
                              ) : (
                                  <div className="avatar-placeholder">
                                      <span>{displayName ? displayName.charAt(0).toUpperCase() : 'U'}</span>
                                  </div>
                              )}
                          </div>
                          <div className="file-input-wrapper">
                              <input 
                                  type="file" 
                                  id="avatar-upload" 
                                  accept="image/*" 
                                  onChange={handleAvatarChange} 
                                  className="hidden-file-input"
                              />
                              <label htmlFor="avatar-upload" className="cds--btn cds--btn--secondary">
                                  Change Authorization
                              </label>
                          </div>
                      </div>
                  </div>

                  <div className="form-group">
                      <TextInput
                          id="displayName"
                          labelText="Display Name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Enter your display name"
                      />
                  </div>

                  <div className="form-group">
                      <PasswordInput
                          id="password"
                          labelText="New Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Leave blank to keep current"
                          autoComplete="new-password"
                      />
                  </div>

                  <div className="form-actions">
                      <Button type="submit" renderIcon={Save}>Save Changes</Button>
                      <Button kind="ghost" renderIcon={Close} onClick={toggleEdit}>Cancel</Button>
                  </div>
              </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
