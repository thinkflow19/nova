import React from 'react';
import styles from './Loading.module.css';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'neural' | 'bars';
  color?: 'primary' | 'secondary' | 'electric' | 'purple' | 'plasma';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'neural',
  color = 'primary',
  text,
  className = '',
  fullScreen = false,
}) => {
  const renderSpinner = () => (
    <div className={`${styles.spinner} ${styles[size]} ${styles[color]}`}>
      <div className={styles.spinnerRing}></div>
      <div className={styles.spinnerRing}></div>
      <div className={styles.spinnerRing}></div>
    </div>
  );

  const renderDots = () => (
    <div className={`${styles.dots} ${styles[size]}`}>
      <div className={`${styles.dot} ${styles[color]}`}></div>
      <div className={`${styles.dot} ${styles[color]}`}></div>
      <div className={`${styles.dot} ${styles[color]}`}></div>
    </div>
  );

  const renderPulse = () => (
    <div className={`${styles.pulse} ${styles[size]} ${styles[color]}`}>
      <div className={styles.pulseRing}></div>
      <div className={styles.pulseCore}></div>
    </div>
  );

  const renderNeural = () => (
    <div className={`${styles.neural} ${styles[size]}`}>
      <div className={styles.neuralOrb}></div>
      <div className={styles.neuralOrb}></div>
      <div className={styles.neuralOrb}></div>
      <div className={styles.neuralOrb}></div>
      <div className={styles.neuralCenter}></div>
    </div>
  );

  const renderBars = () => (
    <div className={`${styles.bars} ${styles[size]}`}>
      <div className={`${styles.bar} ${styles[color]}`}></div>
      <div className={`${styles.bar} ${styles[color]}`}></div>
      <div className={`${styles.bar} ${styles[color]}`}></div>
      <div className={`${styles.bar} ${styles[color]}`}></div>
      <div className={`${styles.bar} ${styles[color]}`}></div>
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return renderSpinner();
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'neural':
        return renderNeural();
      case 'bars':
        return renderBars();
      default:
        return renderNeural();
    }
  };

  const content = (
    <div className={`${styles.loading} ${className}`}>
      {renderLoader()}
      {text && (
        <div className={styles.text}>
          {text}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={styles.fullScreen}>
        <div className={styles.neuralMesh} />
        {content}
      </div>
    );
  }

  return content;
};

export default Loading; 