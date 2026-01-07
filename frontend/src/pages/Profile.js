import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
      <div className="profile-container">
        <h2>Profile</h2>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        {!isEditing ? (
            <div className="profile-view">
                <div className="form-group">
                    <label>Avatar</label>
                    <div className="avatar-preview">
                        {displayAvatar ? (
                             <img src={displayAvatar} alt="Avatar" />
                        ) : (
                            <div className="avatar-placeholder">No Avatar</div>
                        )}
                    </div>
                </div>
                <div className="form-group">
                    <label>Display Name</label>
                    <div className="value">{displayName}</div>
                </div>
                 <div className="form-group">
                    <label>Email</label>
                    <div className="value">{email}</div>
                </div>
                <button onClick={toggleEdit}>Edit Profile</button>
            </div>
        ) : (
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                <label>Display Name</label>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                />
                </div>
                <div className="form-group">
                <label>Avatar</label>
                <div className="avatar-preview">
                    {displayAvatar && <img src={displayAvatar} alt="Avatar Preview" />}
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
                </div>
                <div className="form-group">
                <label>New Password (leave blank to keep current)</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                />
                </div>
                <button type="submit">Save Changes</button>
                <button type="button" className="cancel-btn" onClick={toggleEdit} style={{marginTop: '10px', backgroundColor: '#666'}}>Cancel</button>
            </form>
        )}
    </div>
    </div>
  );
};

export default Profile;
