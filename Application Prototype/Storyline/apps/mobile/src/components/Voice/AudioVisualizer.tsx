/**
 * Audio Visualizer Component
 * Real-time waveform visualization during recording
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Path, G, Circle } from 'react-native-svg';

interface AudioVisualizerProps {
  metering: number;
  isRecording: boolean;
  color?: string;
  backgroundColor?: string;
  height?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const WAVE_SEGMENTS = 30;
const BAR_COUNT = 20;

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  metering,
  isRecording,
  color = '#8854D0',
  backgroundColor = 'transparent',
  height = 100,
}) => {
  const [wavePoints, setWavePoints] = useState<number[]>(new Array(WAVE_SEGMENTS).fill(0));
  const animatedValues = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.1))
  ).current;

  useEffect(() => {
    if (isRecording) {
      // Normalize metering value (typically -160 to 0 dB)
      const normalizedMetering = Math.max(0, (metering + 160) / 160);
      
      // Update wave points for waveform
      setWavePoints(prev => {
        const newPoints = [...prev];
        newPoints.shift();
        newPoints.push(normalizedMetering);
        return newPoints;
      });

      // Animate bars
      animatedValues.forEach((animValue, index) => {
        const randomHeight = normalizedMetering * (0.5 + Math.random() * 0.5);
        Animated.timing(animValue, {
          toValue: randomHeight,
          duration: 100,
          useNativeDriver: false,
        }).start();
      });
    } else {
      // Reset when not recording
      animatedValues.forEach(animValue => {
        Animated.timing(animValue, {
          toValue: 0.1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
      setWavePoints(new Array(WAVE_SEGMENTS).fill(0));
    }
  }, [metering, isRecording, animatedValues]);

  // Generate SVG path for waveform
  const generatePath = () => {
    const segmentWidth = screenWidth / WAVE_SEGMENTS;
    const centerY = height / 2;
    
    let pathData = `M 0 ${centerY}`;
    
    wavePoints.forEach((point, index) => {
      const x = index * segmentWidth;
      const amplitude = point * height * 0.4;
      const y1 = centerY - amplitude * Math.sin(index * 0.5);
      const y2 = centerY + amplitude * Math.sin(index * 0.5);
      
      if (index > 0) {
        const prevX = (index - 1) * segmentWidth;
        const controlX = (prevX + x) / 2;
        pathData += ` Q ${controlX} ${y1} ${x} ${y1}`;
      }
    });
    
    // Draw bottom wave (mirror)
    for (let i = wavePoints.length - 1; i >= 0; i--) {
      const x = i * segmentWidth;
      const amplitude = wavePoints[i] * height * 0.4;
      const y = centerY + amplitude * Math.sin(i * 0.5);
      pathData += ` L ${x} ${y}`;
    }
    
    pathData += ' Z';
    return pathData;
  };

  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      <Svg width={screenWidth} height={height} style={StyleSheet.absoluteFillObject}>
        <Path
          d={generatePath()}
          fill={color}
          fillOpacity={isRecording ? 0.2 : 0.1}
          stroke={color}
          strokeWidth={2}
          strokeOpacity={isRecording ? 0.6 : 0.3}
        />
        {isRecording && (
          <G>
            {wavePoints.map((point, index) => {
              if (index % 5 === 0 && point > 0.3) {
                const x = (index / WAVE_SEGMENTS) * screenWidth;
                const y = height / 2;
                return (
                  <Circle
                    key={index}
                    cx={x}
                    cy={y}
                    r={point * 3}
                    fill={color}
                    fillOpacity={0.6}
                  />
                );
              }
              return null;
            })}
          </G>
        )}
      </Svg>
      
      {/* Bar visualizer overlay */}
      <View style={styles.barsContainer}>
        {animatedValues.map((animValue, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                backgroundColor: color,
                opacity: isRecording ? 0.6 : 0.2,
                height: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height * 0.1, height * 0.8],
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// Simplified visualizer without SVG
export const SimpleAudioVisualizer: React.FC<AudioVisualizerProps> = ({
  metering,
  isRecording,
  color = '#8854D0',
  backgroundColor = 'transparent',
  height = 100,
}) => {
  const bars = 20;
  const normalizedMetering = Math.max(0, (metering + 160) / 160);

  return (
    <View style={[styles.container, styles.simpleContainer, { height, backgroundColor }]}>
      {Array.from({ length: bars }).map((_, index) => {
        const barHeight = isRecording 
          ? Math.random() * normalizedMetering * height * 0.8 + height * 0.1
          : height * 0.1;
        
        return (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: barHeight,
                backgroundColor: color,
                opacity: isRecording ? 0.8 : 0.3,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  simpleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
  },
  barsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 40,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
    marginHorizontal: 2,
  },
});