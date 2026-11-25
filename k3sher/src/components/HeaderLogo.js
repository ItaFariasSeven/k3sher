import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../constants/colors';

export default function HeaderLogo({ title, subtitle }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Image
        source={require('../assets/logo/logok3shercompleto.png')}
        style={styles.imagem}
      />
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    // marginBottom: 4,
    marginTop: 30,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    // marginBottom: 1,
  },
  imagem:{
    width: '100%',
    // height: 90,
    resizeMode: 'contain',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    position: 'relative',
    bottom: 30
  }
});