import { ISalesActivity } from '../models/SalesActivity';

export interface ActivityScore {
  totalScore: number;
  breakdown: {
    duration: number;
    engagement: number;
    outcomes: number;
    followUp: number;
    categoryBonus: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
}

export interface UserPerformanceScore {
  userId: string;
  totalScore: number;
  averageActivityScore: number;
  activityCount: number;
  categoryScores: {
    [category: string]: {
      score: number;
      count: number;
      average: number;
    };
  };
  trends: {
    last7Days: number;
    last30Days: number;
    growth: number;
  };
  rank: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';
}

export class ScoringService {
  
  /**
   * Calculate activity score based on multiple factors
   */
  static calculateActivityScore(activity: ISalesActivity): ActivityScore {
    const breakdown = {
      duration: this.calculateDurationScore(activity),
      engagement: this.calculateEngagementScore(activity),
      outcomes: this.calculateOutcomesScore(activity),
      followUp: this.calculateFollowUpScore(activity),
      categoryBonus: this.calculateCategoryBonus(activity)
    };

    const totalScore = Math.min(100, 
      breakdown.duration + 
      breakdown.engagement + 
      breakdown.outcomes + 
      breakdown.followUp + 
      breakdown.categoryBonus
    );

    const grade = this.getGrade(totalScore);
    const recommendations = this.getRecommendations(activity, breakdown);

    return {
      totalScore,
      breakdown,
      grade,
      recommendations
    };
  }

  /**
   * Duration score: longer meaningful conversations score higher
   */
  private static calculateDurationScore(activity: ISalesActivity): number {
    const duration = activity.transcriptionDuration || activity.qualityMetrics?.duration || 0;
    
    if (duration < 60) return 5; // Less than 1 minute - very low
    if (duration < 300) return 15; // 1-5 minutes - low
    if (duration < 900) return 25; // 5-15 minutes - good
    if (duration < 1800) return 30; // 15-30 minutes - very good
    return 35; // 30+ minutes - excellent
  }

  /**
   * Engagement score based on transcription quality and content
   */
  private static calculateEngagementScore(activity: ISalesActivity): number {
    let score = 0;
    
    // Base engagement from quality metrics
    if (activity.qualityMetrics?.engagement) {
      score += activity.qualityMetrics.engagement * 2; // 0-20 points
    } else {
      score += 10; // Default moderate score
    }

    // Bonus for enhanced AI data (indicates rich conversation)
    if (activity.isEnhanced) {
      score += 5;
    }

    // Bonus for customer info extraction (indicates good discovery)
    if (activity.customerInfo?.name || activity.customerInfo?.company) {
      score += 5;
    }

    // Bonus for deal info (indicates sales progression)
    if (activity.dealInfo?.value || activity.dealInfo?.status) {
      score += 5;
    }

    return Math.min(25, score);
  }

  /**
   * Outcomes score based on action items and next steps
   */
  private static calculateOutcomesScore(activity: ISalesActivity): number {
    let score = 0;

    // Base outcomes from quality metrics
    if (activity.qualityMetrics?.outcomes) {
      score += activity.qualityMetrics.outcomes * 2; // 0-20 points
    } else {
      score += 10; // Default moderate score
    }

    // Bonus for action items (indicates productive meeting)
    const actionItemsCount = activity.actionItems?.length || 0;
    if (actionItemsCount > 0) {
      score += Math.min(10, actionItemsCount * 2); // Up to 10 points for action items
    }

    // Bonus for estimated value (indicates qualified opportunity)
    if (activity.estimatedValue && activity.estimatedValue > 0) {
      score += 5;
    }

    return Math.min(25, score);
  }

  /**
   * Follow-up score based on completion and timeliness
   */
  private static calculateFollowUpScore(activity: ISalesActivity): number {
    let score = 0;

    // Completed activities get higher scores
    if (activity.status === 'completed') {
      score += 10;
    } else if (activity.status === 'follow-up') {
      score += 5;
    }

    // Bonus for timely completion
    if (activity.completedDate && activity.dueDate) {
      const wasOnTime = activity.completedDate <= activity.dueDate;
      score += wasOnTime ? 5 : -5;
    }

    // Bonus for follow-up completion
    if (activity.qualityMetrics?.followUpCompleted) {
      score += 5;
    }

    return Math.max(0, Math.min(15, score));
  }

  /**
   * Category bonus based on sales funnel stage importance
   */
  private static calculateCategoryBonus(activity: ISalesActivity): number {
    const categoryScores = {
      'prospecting': 5,
      'qualification': 10,
      'presentation': 15,
      'negotiation': 20,
      'closing': 25,
      'follow-up': 8,
      'support': 5
    };

    return categoryScores[activity.category] || 5;
  }

  /**
   * Convert numeric score to letter grade
   */
  private static getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate improvement recommendations
   */
  private static getRecommendations(activity: ISalesActivity, breakdown: any): string[] {
    const recommendations: string[] = [];

    if (breakdown.duration < 20) {
      recommendations.push('ใช้เวลาในการสนทนากับลูกค้าให้มากขึ้นเพื่อสร้างความสัมพันธ์');
    }

    if (breakdown.engagement < 15) {
      recommendations.push('ถามคำถามเพิ่มเติมเพื่อเข้าใจความต้องการของลูกค้า');
    }

    if (breakdown.outcomes < 15) {
      recommendations.push('กำหนด action items และขั้นตอนถัดไปให้ชัดเจน');
    }

    if (!activity.actionItems || activity.actionItems.length === 0) {
      recommendations.push('บันทึก action items หลังการสนทนาเสมอ');
    }

    if (!activity.estimatedValue || activity.estimatedValue === 0) {
      recommendations.push('ประเมินมูลค่าของโอกาสทางการขาย');
    }

    if (activity.category === 'prospecting' && breakdown.totalScore < 60) {
      recommendations.push('เพิ่มการวิจัยข้อมูลลูกค้าก่อนติดต่อ');
    }

    return recommendations;
  }

  /**
   * Calculate user performance score based on all activities
   */
  static calculateUserPerformance(activities: ISalesActivity[]): UserPerformanceScore {
    if (activities.length === 0) {
      return {
        userId: '',
        totalScore: 0,
        averageActivityScore: 0,
        activityCount: 0,
        categoryScores: {},
        trends: { last7Days: 0, last30Days: 0, growth: 0 },
        rank: 0,
        level: 'Beginner'
      };
    }

    const totalScore = activities.reduce((sum, activity) => sum + activity.activityScore, 0);
    const averageActivityScore = totalScore / activities.length;

    // Calculate category scores
    const categoryScores: any = {};
    activities.forEach(activity => {
      if (!categoryScores[activity.category]) {
        categoryScores[activity.category] = { score: 0, count: 0, average: 0 };
      }
      categoryScores[activity.category].score += activity.activityScore;
      categoryScores[activity.category].count += 1;
    });

    // Calculate averages for each category
    Object.keys(categoryScores).forEach(category => {
      categoryScores[category].average = categoryScores[category].score / categoryScores[category].count;
    });

    // Calculate trends
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentActivities = activities.filter(a => new Date(a.createdAt) >= last7Days);
    const monthlyActivities = activities.filter(a => new Date(a.createdAt) >= last30Days);

    const recent7DaysScore = recentActivities.length > 0 ? 
      recentActivities.reduce((sum, a) => sum + a.activityScore, 0) / recentActivities.length : 0;
    const monthly30DaysScore = monthlyActivities.length > 0 ? 
      monthlyActivities.reduce((sum, a) => sum + a.activityScore, 0) / monthlyActivities.length : 0;

    const growth = monthly30DaysScore > 0 ? ((recent7DaysScore - monthly30DaysScore) / monthly30DaysScore) * 100 : 0;

    return {
      userId: activities[0]?.createdBy?.toString() || '',
      totalScore,
      averageActivityScore,
      activityCount: activities.length,
      categoryScores,
      trends: {
        last7Days: recent7DaysScore,
        last30Days: monthly30DaysScore,
        growth
      },
      rank: 0, // Would be calculated relative to other users
      level: this.getPerformanceLevel(averageActivityScore, activities.length)
    };
  }

  /**
   * Determine performance level based on average score and activity count
   */
  private static getPerformanceLevel(averageScore: number, activityCount: number): 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master' {
    if (activityCount < 10) return 'Beginner';
    if (averageScore >= 85 && activityCount >= 50) return 'Master';
    if (averageScore >= 75 && activityCount >= 30) return 'Expert';
    if (averageScore >= 65 && activityCount >= 20) return 'Advanced';
    if (averageScore >= 55) return 'Intermediate';
    return 'Beginner';
  }
}

export default ScoringService;