import mongoose from 'mongoose';

// MongoDB 연결 URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/searchyoutube';

// 연결 캐시
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// MongoDB 연결 함수
export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// 사용자 스키마
const UserSchema = new mongoose.Schema({
  _id: String,
  username: String,
  email: String,
  is_premium: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

// 검색 로그 스키마
const SearchLogSchema = new mongoose.Schema({
  user_id: String,
  keyword: String,
  result_count: Number,
  timestamp: { type: Date, default: Date.now }
});

// 다운로드 로그 스키마
const DownloadLogSchema = new mongoose.Schema({
  user_id: String,
  keyword: String,
  result_count: Number,
  timestamp: { type: Date, default: Date.now }
});

// 모델 생성 (이미 존재하는 경우 재사용)
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const SearchLog = mongoose.models.SearchLog || mongoose.model('SearchLog', SearchLogSchema);
export const DownloadLog = mongoose.models.DownloadLog || mongoose.model('DownloadLog', DownloadLogSchema);

// 검색 로그 저장 함수
export async function saveSearchLog(userId: string, keyword: string, resultCount: number) {
  try {
    await connectToDatabase();
    
    // 사용자 확인 또는 생성
    await ensureUser(userId);
    
    // 검색 로그 저장
    await SearchLog.create({
      user_id: userId,
      keyword,
      result_count: resultCount,
    });
  } catch (error) {
    console.error('검색 로그 저장 오류:', error);
  }
}

// 다운로드 로그 저장 함수
export async function saveDownloadLog(userId: string, keyword: string, resultCount: number) {
  try {
    await connectToDatabase();
    
    // 사용자 확인 또는 생성
    await ensureUser(userId);
    
    // 다운로드 로그 저장
    await DownloadLog.create({
      user_id: userId,
      keyword,
      result_count: resultCount,
    });
  } catch (error) {
    console.error('다운로드 로그 저장 오류:', error);
  }
}

// 사용자 확인 또는 생성 함수
async function ensureUser(userId: string) {
  const user = await User.findById(userId);
  
  if (!user) {
    await User.create({
      _id: userId,
      is_premium: process.env.NODE_ENV === 'development' ? true : false,
    });
  }
} 