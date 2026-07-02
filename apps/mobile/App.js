import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getBackendBaseUrl } from './src/api/baziApi';
import BaziInputScreen from './src/screens/BaziInputScreen';
import BaziResultScreen from './src/screens/BaziResultScreen';

export default function App() {
  const backendBaseUrl = getBackendBaseUrl();
  const [reading, setReading] = useState(null);
  const [lastPayload, setLastPayload] = useState(null);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.shell}>
        {reading ? (
          <BaziResultScreen
            backendBaseUrl={backendBaseUrl}
            payload={lastPayload}
            reading={reading}
            onBack={() => setReading(null)}
          />
        ) : (
          <BaziInputScreen
            backendBaseUrl={backendBaseUrl}
            onResult={(nextReading, payload) => {
              setLastPayload(payload);
              setReading(nextReading);
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#121421'
  },
  shell: {
    flex: 1
  }
});
