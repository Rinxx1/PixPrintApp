// Filter Carousel Component
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { INSTAGRAM_FILTERS, FILTER_SIZE, FILTER_SPACING } from './constants';
import { styles } from './styles';

const { width } = Dimensions.get('window');

export const FilterCarousel = ({
  selectedFilterIndex,
  changeFilter,
  isUserScrolling,
  setIsUserScrolling,
  carouselRef,
  hasUserInteractedRef,
  initialCarouselOffsetRef
}) => {
  const itemWidth = FILTER_SIZE + FILTER_SPACING;
  const containerWidth = width - 32; // bottomControls has 16px horizontal padding on both sides
  const horizontalPadding = Math.max(0, Math.round((containerWidth - itemWidth) / 2));
  
  if (initialCarouselOffsetRef.current === null) {
    // Start at offset 0 because left padding already centers the first item
    initialCarouselOffsetRef.current = 0;
  }

  const getItemLayout = (_, index) => ({ length: itemWidth, offset: itemWidth * index, index });
  
  const onMomentumEnd = (event) => {
    const offsetX = Math.max(0, event.nativeEvent.contentOffset.x);
    const centeredIndex = Math.round(offsetX / itemWidth);
    changeFilter(centeredIndex);
  };
  
  const onScrollBeginDrag = () => { 
    setIsUserScrolling(true); 
    hasUserInteractedRef.current = true; 
  };
  
  const onMomentumEndWrapper = (e) => {
    if (!hasUserInteractedRef.current) {
      // Ignore first synthetic momentum event that can fire on mount
      setIsUserScrolling(false);
      return;
    }
    onMomentumEnd(e);
    setIsUserScrolling(false);
  };

  return (
    <View style={[styles.carouselContainer, { width: containerWidth }]}> 
      <FlatList
        ref={carouselRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth}
        snapToAlignment="start"
        decelerationRate={0.9}
        contentContainerStyle={[styles.carouselRow, { paddingLeft: horizontalPadding, paddingRight: horizontalPadding }]}
        data={INSTAGRAM_FILTERS}
        keyExtractor={(item) => item.value}
        // Use a stable, one-time contentOffset to avoid resetting on re-renders
        contentOffset={{ x: initialCarouselOffsetRef.current, y: 0 }}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={onMomentumEndWrapper}
        onMomentumScrollBegin={() => setIsUserScrolling(true)}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={() => { /* keep scrolling state until momentum ends */ }}
        disableIntervalMomentum={false}
        bounces={false}
        onScrollToIndexFailed={({ index }) => {
          const targetOffset = horizontalPadding + index * itemWidth;
          setTimeout(() => {
            try { carouselRef.current?.scrollToOffset({ offset: targetOffset, animated: false }); } catch (_) {}
          }, 50);
        }}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.carouselItem, index === selectedFilterIndex && styles.carouselItemActive]}
            activeOpacity={0.8}
            onPress={() => changeFilter(index)}
          >
            <LinearGradient
              colors={item.gradient}
              style={styles.carouselCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {index === selectedFilterIndex && (
                <View style={styles.carouselActiveBorder} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
