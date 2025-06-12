import React, { useEffect, useState } from 'react';
import { Button, View, Text } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { Video } from 'react-native-video';

const SERVER_URL = 'http://localhost:5000';

export default function App() {
  const [streams, setStreams] = useState([]);
  const [user, setUser] = useState(null);

  const signInWithGoogle = async () => {
    const redirectUrl = AuthSession.makeRedirectUri({ useProxy: true });
    const result = await AuthSession.startAsync({
      authUrl: `${SERVER_URL}/login/google?redirect_uri=${encodeURIComponent(redirectUrl)}`,
      returnUrl: redirectUrl
    });
    if (result.type === 'success') {
      fetch(`${SERVER_URL}/`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          setUser(data.user);
          setStreams(data.streams);
        });
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {user ? (
        <>
          <Text>Welcome {user.name}</Text>
          {streams.map((s, i) => (
            <Video
              key={i}
              source={{ uri: s.url }}
              style={{ width: 300, height: 200, marginVertical: 10 }}
              controls
            />
          ))}
        </>
      ) : (
        <Button title="Login with Google" onPress={signInWithGoogle} />
      )}
    </View>
  );
}
