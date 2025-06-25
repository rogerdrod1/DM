import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Plus, LogIn, LogOut, Users } from 'lucide-react';
import { userManager } from '../lib/userManager';

const UserAuth = ({ onAuthChange }) => {
  const [currentUser, setCurrentUser] = useState(userManager.getCurrentUser());
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState('');

  // Registration form data
  const [registerData, setRegisterData] = useState({
    username: '',
    displayName: '',
    businessName: '',
    email: ''
  });

  // Login form data
  const [loginUsername, setLoginUsername] = useState('');

  useEffect(() => {
    setAllUsers(userManager.getAllUsers());
  }, []);

  const handleRegister = () => {
    try {
      setError('');
      const newUser = userManager.createUser(registerData);
      setCurrentUser(newUser);
      setAllUsers(userManager.getAllUsers());
      setShowRegister(false);
      setRegisterData({ username: '', displayName: '', businessName: '', email: '' });
      onAuthChange?.(newUser);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = (username = loginUsername) => {
    try {
      setError('');
      const user = userManager.loginUser(username);
      setCurrentUser(user);
      setAllUsers(userManager.getAllUsers());
      setShowLogin(false);
      setLoginUsername('');
      onAuthChange?.(user);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    userManager.logout();
    setCurrentUser(null);
    onAuthChange?.(null);
  };

  const handleDeleteUser = (userId) => {
    if (userManager.deleteUser(userId)) {
      setAllUsers(userManager.getAllUsers());
      if (currentUser?.id === userId) {
        setCurrentUser(null);
        onAuthChange?.(null);
      }
    }
  };

  const exportUserData = () => {
    userManager.exportUserData();
  };

  // If user is logged in, show user info
  if (currentUser) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4" />
        <span className="font-medium">{currentUser.displayName}</span>
        <span className="text-muted-foreground">({currentUser.businessName || currentUser.username})</span>
        <Button variant="outline" size="sm" onClick={exportUserData}>
          Export Data
        </Button>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-1" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* User Selection */}
      {!showLogin && !showRegister && (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select User Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {allUsers.length > 0 && (
              <div className="space-y-2">
                <Label>Existing Users:</Label>
                {allUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{user.displayName}</div>
                      <div className="text-sm text-muted-foreground">{user.businessName || user.username}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleLogin(user.username)}>
                        Login
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={() => setShowLogin(true)} className="flex-1">
                <LogIn className="h-4 w-4 mr-1" />
                Login
              </Button>
              <Button onClick={() => setShowRegister(true)} variant="outline" className="flex-1">
                <Plus className="h-4 w-4 mr-1" />
                New User
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Login Form */}
      {showLogin && (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex gap-2">
              <Button onClick={() => handleLogin()} disabled={!loginUsername} className="flex-1">
                Login
              </Button>
              <Button variant="outline" onClick={() => setShowLogin(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Form */}
      {showRegister && (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reg-username">Username *</Label>
              <Input
                id="reg-username"
                value={registerData.username}
                onChange={(e) => setRegisterData(prev => ({...prev, username: e.target.value}))}
                placeholder="Choose a username"
              />
            </div>
            <div>
              <Label htmlFor="reg-displayname">Display Name *</Label>
              <Input
                id="reg-displayname"
                value={registerData.displayName}
                onChange={(e) => setRegisterData(prev => ({...prev, displayName: e.target.value}))}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label htmlFor="reg-business">Business Name</Label>
              <Input
                id="reg-business"
                value={registerData.businessName}
                onChange={(e) => setRegisterData(prev => ({...prev, businessName: e.target.value}))}
                placeholder="Your business name (optional)"
              />
            </div>
            <div>
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData(prev => ({...prev, email: e.target.value}))}
                placeholder="your@email.com (optional)"
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex gap-2">
              <Button 
                onClick={handleRegister} 
                disabled={!registerData.username || !registerData.displayName}
                className="flex-1"
              >
                Create User
              </Button>
              <Button variant="outline" onClick={() => setShowRegister(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserAuth;