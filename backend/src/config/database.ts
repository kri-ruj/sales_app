import mongoose from 'mongoose';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('📦 Already connected to MongoDB');
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bright_sales';
      
      await mongoose.connect(mongoUri, {
        // Modern connection options
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4 // Force IPv4
      });

      this.isConnected = true;
      console.log('🚀 MongoDB connected successfully');
      console.log(`📍 Database: ${mongoose.connection.name}`);

      // Set up connection event listeners
      this.setupEventListeners();

    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      
      // In development, create mock data if MongoDB is not available
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 MongoDB not available, continuing with in-memory mock data');
        return;
      }
      
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('💤 MongoDB disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port
    };
  }

  private setupEventListeners(): void {
    mongoose.connection.on('error', (error) => {
      console.error('🚨 MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('💔 MongoDB disconnected');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
      this.isConnected = true;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await this.disconnect();
        console.log('📴 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    });
  }

  // Seed initial data for development
  public async seedInitialData(): Promise<void> {
    if (!this.isConnected) {
      console.log('⚠️ Cannot seed data: Database not connected');
      return;
    }

    try {
      const User = (await import('../models/User')).default;
      const SalesActivity = (await import('../models/SalesActivity')).default;

      // Check if admin user exists
      const adminExists = await User.findOne({ role: 'admin' });
      
      if (!adminExists) {
        console.log('🌱 Seeding initial admin user...');
        
        const adminUser = new User({
          username: 'admin',
          email: 'admin@brightsales.com',
          password: 'SecureP@ssw0rd2024!',
          firstName: 'System',
          lastName: 'Administrator', 
          role: 'admin'
        });

        await adminUser.save();
        
        // Create sample sales user
        const salesUser = new User({
          username: 'sales1',
          email: 'sales@brightsales.com',
          password: 'StrongP@ssw0rd2024!',
          firstName: 'สมชาย',
          lastName: 'ขายดี',
          role: 'sales'
        });

        await salesUser.save();
        
        console.log('✅ Initial users created successfully');

        // Create sample activities
        const sampleActivities = [
          {
            title: 'ติดตามลูกค้า ABC Company',
            description: 'ติดตามผลการพิจารณาข้อเสนอโครงการ Cloud Infrastructure',
            customerName: 'บริษัท ABC จำกัด',
            contactInfo: 'คุณสมชาย โทร: 081-234-5678',
            activityType: 'call',
            status: 'pending',
            priority: 'high',
            actionItems: ['โทรติดตาม', 'ส่งข้อมูลเพิ่มเติม'],
            tags: ['enterprise', 'cloud'],
            createdBy: salesUser._id,
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            estimatedValue: 500000
          },
          {
            title: 'นัดประชุม XYZ Corporation',
            description: 'นำเสนอแพ็คเกจ SaaS Solution สำหรับองค์กร',
            customerName: 'XYZ Corporation',
            contactInfo: 'คุณวิทยา อีเมล: vitaya@xyz.com',
            activityType: 'meeting',
            status: 'completed',
            priority: 'medium',
            actionItems: ['เตรียมสไลด์', 'ส่งใบเสนอราคา'],
            tags: ['saas', 'meeting'],
            createdBy: salesUser._id,
            completedDate: new Date(),
            actualValue: 300000
          }
        ];

        await SalesActivity.insertMany(sampleActivities);
        console.log('✅ Sample activities created successfully');

        // Create default sales board
        const TaskBoard = (await import('../models/TaskBoard')).default;
        const boardExists = await TaskBoard.findOne({ type: 'sales' });
        
        if (!boardExists) {
          console.log('🌱 Creating default sales board...');
          
          const defaultSalesBoard = new TaskBoard({
            name: 'Sales Pipeline',
            description: 'Main sales pipeline and task management board',
            type: 'sales',
            owner: adminUser._id,
            members: [
              {
                userId: adminUser._id,
                role: 'owner',
                addedAt: new Date(),
                addedBy: adminUser._id
              },
              {
                userId: salesUser._id,
                role: 'member',
                addedAt: new Date(),
                addedBy: adminUser._id
              }
            ],
            columns: [
              {
                id: 'todo',
                name: 'To Do',
                color: '#6B7280',
                position: 1,
                wipLimit: 10,
                isDefault: true
              },
              {
                id: 'in-progress',
                name: 'In Progress',
                color: '#3B82F6',
                position: 2,
                wipLimit: 5,
                isDefault: true
              },
              {
                id: 'review',
                name: 'Review',
                color: '#F59E0B',
                position: 3,
                wipLimit: 3,
                isDefault: true
              },
              {
                id: 'done',
                name: 'Done',
                color: '#10B981',
                position: 4,
                isDefault: true
              }
            ],
            labels: [
              {
                id: 'hot-lead',
                name: 'Hot Lead',
                color: '#EF4444',
                description: 'High priority prospect'
              },
              {
                id: 'qualified',
                name: 'Qualified',
                color: '#10B981',
                description: 'Qualified prospect'
              },
              {
                id: 'follow-up',
                name: 'Follow-up',
                color: '#F59E0B',
                description: 'Requires follow-up'
              },
              {
                id: 'proposal',
                name: 'Proposal',
                color: '#8B5CF6',
                description: 'Proposal sent'
              }
            ],
            settings: {
              allowMemberInvites: true,
              allowFileUploads: true,
              requireTaskApproval: false,
              autoArchiveCompleted: false,
              emailNotifications: true,
              lineNotifications: false,
            },
            isActive: true,
            lastActivityAt: new Date(),
            taskCount: 0,
            completedTaskCount: 0
          });

          await defaultSalesBoard.save();
          console.log('✅ Default sales board created successfully');
        }
      }

    } catch (error) {
      console.error('❌ Error seeding initial data:', error);
    }
  }
}

export default DatabaseConnection.getInstance(); 