'use client';

import React, { useState, useCallback } from 'react';
import { RuleViolation, InteractionType } from '@/lib/rules/types';
import { RiskPopup } from './risk-popup';
import { RiskBanner } from './risk-banner';
import { RiskDisplay } from './risk-display';

interface RiskInterceptorProps {
  violations: RuleViolation[];
  onConfirmed: () => void;
  onCancelled: () => void;
}

export function RiskInterceptor({ violations, onConfirmed, onCancelled }: RiskInterceptorProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [displayViolations, setDisplayViolations] = useState<RuleViolation[]>([]);

  React.useEffect(() => {
    const popupViolations = violations.filter(
      (v) => v.interactionType === 'popup-confirm'
    );
    const bannerViolations = violations.filter(
      (v) => v.interactionType === 'banner-check'
    );
    const displayOnlyViolations = violations.filter(
      (v) => v.interactionType === 'display-only'
    );

    if (popupViolations.length > 0) {
      setShowPopup(true);
    } else if (bannerViolations.length > 0) {
      setShowBanner(true);
    } else {
      setDisplayViolations(displayOnlyViolations);
    }
  }, [violations]);

  const handlePopupConfirm = useCallback(() => {
    setShowPopup(false);
    const bannerViolations = violations.filter(
      (v) => v.interactionType === 'banner-check'
    );
    if (bannerViolations.length > 0) {
      setShowBanner(true);
    } else {
      onConfirmed();
    }
  }, [violations, onConfirmed]);

  const handlePopupCancel = useCallback(() => {
    setShowPopup(false);
    onCancelled();
  }, [onCancelled]);

  const handleBannerConfirm = useCallback(() => {
    setShowBanner(false);
    onConfirmed();
  }, [onConfirmed]);

  const handleBannerDismiss = useCallback(() => {
    setShowBanner(false);
    onCancelled();
  }, [onCancelled]);

  const popupViolations = violations.filter((v) => v.interactionType === 'popup-confirm');
  const bannerViolations = violations.filter((v) => v.interactionType === 'banner-check');
  const displayOnlyViolations = violations.filter((v) => v.interactionType === 'display-only');

  return (
    <div className="space-y-4">
      {showPopup && (
        <RiskPopup
          violations={popupViolations}
          onConfirm={handlePopupConfirm}
          onCancel={handlePopupCancel}
        />
      )}

      {showBanner && !showPopup && (
        <RiskBanner
          violations={bannerViolations}
          onConfirm={handleBannerConfirm}
          onDismiss={handleBannerDismiss}
        />
      )}

      {!showPopup && !showBanner && displayOnlyViolations.length > 0 && (
        <RiskDisplay violations={displayOnlyViolations} />
      )}
    </div>
  );
}
