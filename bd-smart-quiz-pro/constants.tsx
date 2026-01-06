
import React from 'react';
import { Subject, QuizCard } from './types';

// Exported ADMIN_EMAIL to resolve error in App.tsx
export const ADMIN_EMAIL = 'admin@smartquiz.com';

export const SUBJECTS: Subject[] = [
  { id: 'ca', title: 'কারেন্ট অ্যাফেয়ার্স', icon: '🌐', color: '#3b82f6' },
  { id: 'bl', title: 'বাংলা সাহিত্য', icon: 'অ', color: '#f59e0b' },
  { id: 'bg', title: 'বাংলা ভাষা ও ব্যাকরণ', icon: 'অঃ', color: '#ef4444' },
  { id: 'el', title: 'English Literature', icon: 'al', color: '#8b5cf6' },
  { id: 'en', title: 'English Language', icon: 'Aa', color: '#6366f1' },
  { id: 'math', title: 'গাণিতিক যুক্তি', icon: '√x', color: '#ec4899' },
  { id: 'gs', title: 'সাধারণ বিজ্ঞান', icon: '🧪', color: '#10b981' },
  { id: 'bd', title: 'বাংলাদেশ বিষয়াবলি', icon: '🇧🇩', color: '#059669' },
  { id: 'intl', title: 'আন্তর্জাতিক বিষয়াবলি', icon: '🌍', color: '#f43f5e' },
  { id: 'geo', title: 'ভূগোল ও দুর্যোগ ব্যবস্থাপনা', icon: '🌎', color: '#0ea5e9' },
  { id: 'ethics', title: 'নৈতিকতা ও সুশাসন', icon: '⚖️', color: '#8b5cf6' },
  { id: 'comp', title: 'কম্পিউটার ও তথ্যপ্রযুক্তি', icon: '💻', color: '#4f46e5' },
  { id: 'mental', title: 'মানসিক দক্ষতা', icon: '📘', color: '#3b82f6' },
];

// Added missing subject constants for ExamTab.tsx
export const BCS_SUBJECTS = SUBJECTS;
export const PRIMARY_SUBJECTS = SUBJECTS;
export const JUNIOR_SUBJECTS = SUBJECTS;
export const SSC_SUBJECTS = SUBJECTS;
export const HSC_SUBJECTS = SUBJECTS;
export const ADMISSION_SUBJECTS = SUBJECTS;
export const ISLAMIC_SUBJECTS = SUBJECTS;
export const JOB_PREP_SUBJECTS = SUBJECTS;

export const MODEL_TESTS: QuizCard[] = [
  { id: 'm1', title: 'ফ্রি প্রাইমারি', subtitle: 'মডেল টেস্ট', count: 8, isLive: true, gradient: 'from-blue-500 to-blue-700' },
  { id: 'm2', title: 'ফ্রি মডেল টেস্ট', subtitle: 'সাপ্তাহিক', count: 10, isLive: true, gradient: 'from-green-500 to-green-700' },
  { id: 'm3', title: '৪০তম বিসিএস', subtitle: '১৫০ দিনের প্রস্তুতি', count: 66, isLive: true, gradient: 'from-emerald-600 to-emerald-800' },
];

export const BCS_CARDS: QuizCard[] = [
  { id: 'b1', title: 'বিসিএস', subtitle: 'প্রিলি প্রস্তুতি', count: 40, gradient: 'from-amber-200 to-amber-400' },
  { id: 'b2', title: 'বাংলা', subtitle: 'BCS', count: 19, gradient: 'from-yellow-400 to-yellow-600' },
  { id: 'b3', title: 'ইংরেজি', subtitle: 'BCS', count: 19, gradient: 'from-red-500 to-red-700' },
  { id: 'b4', title: 'সাধারণ বিজ্ঞান', subtitle: 'বিসিএস', count: 16, gradient: 'from-green-500 to-green-700' },
];
