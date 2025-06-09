'use client';

import React from 'react';
import { Agent } from '@/types';
import { Card, Button } from '@/components/ui';
import styles from './AgentCard.module.css';

export interface AgentCardProps {
  agent: Agent;
  onSelect?: (agent: Agent) => void;
  className?: string;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onSelect, className = '' }) => {
  const statusBadge = {
    available: { text: 'Available', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    beta: { text: 'Beta', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    coming_soon: { text: 'Coming Soon', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  }[agent.status];

  const handleSelect = () => {
    if (agent.status !== 'coming_soon') {
      onSelect?.(agent);
    }
  };

  return (
    <Card
      variant="glass"
      hover={agent.status !== 'coming_soon'}
      className={`${styles.agentCard} ${className}`}
      onClick={handleSelect}
    >
      <div className={styles.inner}>
        <div className={styles.header}>
          <div
            className={styles.iconContainer}
            style={{ backgroundColor: `${agent.color}20`, borderColor: `${agent.color}40` }}
          >
            <span className={styles.icon}>{agent.icon}</span>
          </div>
          <div className={styles.info}>
            <h3 className={styles.name}>{agent.name}</h3>
            <span className={styles.model}>{agent.model}</span>
          </div>
          <span className={`${styles.badge} ${statusBadge.color}`}>{statusBadge.text}</span>
        </div>
        <p className={styles.description}>{agent.description}</p>
        <div className={styles.capabilities}>
          {agent.capabilities.map(cap => (
            <span key={cap} className={styles.capability}>
              {cap}
            </span>
          ))}
        </div>
        {agent.status !== 'coming_soon' && (
          <div className={styles.action}>
            <Button
              variant={agent.status === 'beta' ? 'secondary' : 'primary'}
              size="sm"
              className="w-full"
              onClick={e => {
                e.stopPropagation();
                handleSelect();
              }}
            >
              {agent.status === 'beta' ? 'Try Beta' : 'Start Chat'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AgentCard;
