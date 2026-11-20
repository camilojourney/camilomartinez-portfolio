'use client';

import React from 'react';
import Image from 'next/image';

interface TechFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  imageUrl: string;
  description?: string;
  demoUrl?: string;
}

export function TechFlowModal({ isOpen, onClose, title, imageUrl, description, demoUrl }: TechFlowModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-2"
      onClick={onClose}
    >
      <div 
        className="relative max-w-6xl w-full bg-surface-2 rounded-2xl shadow-2xl overflow-hidden border border-line"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-line">
          <h3 className="text-2xl font-bold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors p-2 hover:bg-surface-2 rounded-lg"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {description && (
            <p className="text-muted mb-6 text-lg leading-relaxed text-center">
              {description}
            </p>
          )}
          
          {/* Tech Flow Diagram */}
          <div className="relative w-full bg-surface rounded-xl overflow-hidden shadow-xl">
            <Image
              src={imageUrl}
              alt={title}
              width={2064}
              height={1112}
              className="w-full h-auto"
              priority
              unoptimized
            />
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="flex justify-center items-center gap-4 p-6 border-t border-line bg-surface-2">
          {demoUrl && (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 text-ink font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <span>Try Live App</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          )}
          
          <button
            onClick={onClose}
            className="px-6 py-2 bg-surface-2 hover:bg-surface-2 text-ink rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
