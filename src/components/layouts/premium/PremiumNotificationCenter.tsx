import React from 'react';
import NotificationCenter from '../../NotificationCenter';

// Wrapper for the existing NotificationCenter to match premium styling
// The actual NotificationCenter already exists, we'll just import and style its container if needed,
// but for now we'll just render it directly as it's self-contained.
// Wait, the existing NotificationCenter uses a button. Let's see if we need to modify it or just render it.

export default function PremiumNotificationCenter() {
  return (
    <div className="premium-notification-wrapper">
      <NotificationCenter />
    </div>
  );
}
