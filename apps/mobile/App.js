import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getBackendBaseUrl } from './src/api/baziApi';

export default function App() {
  const backendBaseUrl = getBackendBaseUrl();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>八字排盘</Text>
          <Text style={styles.subtitle}>精准、稳定、专业的排盘系统</Text>
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>App 版已启动</Text>
          <Text style={styles.copy}>
            当前版本先连接后端排盘能力，算法和权威数据仍由后端统一负责。
          </Text>
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>后端接口</Text>
          <Text style={styles.label}>当前地址</Text>
          <Text style={styles.codeText}>{backendBaseUrl}</Text>
          <Text style={styles.copy}>
            已对齐排盘计算和历法覆盖范围接口，下一步接入真实输入表单。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#161626'
  },
  container: {
    padding: 24
  },
  header: {
    paddingTop: 28,
    paddingBottom: 20
  },
  title: {
    color: '#f5e4a7',
    fontSize: 32,
    fontWeight: '700'
  },
  subtitle: {
    color: '#d8d8e8',
    fontSize: 15,
    marginTop: 8
  },
  panel: {
    borderWidth: 1,
    borderColor: '#38384f',
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#202033',
    marginBottom: 14
  },
  panelTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700'
  },
  copy: {
    color: '#d8d8e8',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10
  },
  label: {
    color: '#f5e4a7',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14
  },
  codeText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  }
});
