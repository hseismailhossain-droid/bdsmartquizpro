
import React from 'react';

export enum Category {
  PRIMARY = 'Primary',
  JUNIOR = 'Junior',
  SSC = 'SSC',
  HSC = 'HSC',
  ADMISSION = 'Admission',
  ISLAMIC = 'Islamic',
  JOB_PREP = 'Job Prep',
  BCS = 'BCS'
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string | null;
  category: string;
  balance: number;
  totalPoints: number;
  streak: number;
  avatarUrl: string;
  levelsCleared?: number;
}

export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  marks?: number;
}

export interface WrittenAnswer {
  question: string;
  userAnswer: string;
  maxMarks: number;
  marksGained?: number;
  feedback?: string;
  modelAnswer?: string;
}

export interface WrittenSubmission {
  id: string;
  uid: string;
  userName: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  answers: WrittenAnswer[];
  totalScore: number;
  status: 'pending' | 'graded';
  timestamp: any;
  gradedAt?: any;
}

export interface QuizResult {
  id?: string;
  uid?: string;
  userName?: string;
  quizId?: string;
  subject: string;
  score: number;
  total: number;
  timestamp?: any;
  date: string;
  mistakes?: Question[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: any;
  isRead: boolean;
  time?: string;
}

export interface DepositRequest {
  id: string;
  uid: string;
  userName: string;
  amount: number;
  method: 'bkash' | 'nagad';
  trxId: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: any;
}

export interface WithdrawRequest {
  id: string;
  uid: string;
  userName: string;
  amount: number;
  method: 'bkash' | 'nagad';
  accountNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: any;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  category: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  timestamp?: any;
}

export interface UserReport {
  id: string;
  uid: string;
  userName: string;
  category: string;
  message: string;
  status: 'pending' | 'resolved';
  timestamp: any;
}

export interface ExamCategory {
  id: string;
  label: string;
  iconName: string;
  color: string;
  thumbnailUrl?: string; 
  timestamp: any;
}

export interface Subject {
  id: string;
  title: string;
  icon: string | React.ReactNode;
  color: string;
}

export interface QuizCard {
  id: string;
  title: string;
  subtitle: string;
  count: number;
  isLive?: boolean;
  isPaid?: boolean;
  gradient?: string;
  entryFee?: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

export interface Comment {
  id: string;
  uid: string;
  userName: string;
  userAvatar: string;
  text: string;
  time: string;
  timestamp: any;
  replyTo?: {
    uid: string;
    userName: string;
  };
}

export interface Post {
  id: string;
  uid: string;
  userName: string;
  userAvatar: string;
  content: string;
  audio?: string;
  pdf?: string;
  isAnonymous: boolean;
  likes: number;
  likedBy: string[];
  commentsCount: number;
  views: number;
  timestamp: any;
  time: string;
}

export interface Story {
  id: string;
  uid: string;
  userName: string;
  userAvatar: string;
  media: any;
  mediaType: 'image' | 'video' | 'audio' | 'pdf';
  timestamp_ms: number;
}

export interface PaidQuiz {
  id: string;
  title: string;
  subject: string;
  prizePool: number;
  entryFee: number;
  status: 'active' | 'ended';
  timestamp: any;
  startTime?: string;
  endTime?: string;
  duration?: number;
  manualQuestions?: Question[];
}

export interface AdUnit {
  id: string;
  label: string;
  placementId: string;
  network: 'adsense' | 'admob' | 'adsterra' | 'custom' | 'none';
  adType: 'script' | 'id' | 'image' | 'video';
  content: string;
  link?: string;
  active: boolean;
  order: number;
  updatedAt?: number;
}
