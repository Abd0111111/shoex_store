const mongoose = require("mongoose");

// Cache الاتصال عبر الـ global object
// في serverless، الـ module قد يُعاد استخدامه بين الـ invocations (warm start)
// فبنستخدم global عشان نضمن إن الـ cache يفضل موجود حتى لو الملف اتعمله require تاني
let cached = global.mongooseConnection;

if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
  // لو فيه اتصال جاهز ومتصل بالفعل، استخدمه على طول من غير أي انتظار
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // لو مفيش promise شغالة، ابدأ اتصال جديد وخزّن الـ promise نفسها (مش النتيجة)
  // ده مهم عشان لو جت أكتر من request في نفس اللحظة، كلهم يستنوا نفس الـ promise
  // بدل ما كل واحد يعمل اتصال منفصل
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // يمنع mongoose من تكديس queries وهو مستني اتصال
      maxPoolSize: 10, // مناسب لـ serverless، مش محتاجين pool كبير زي سيرفر تقليدي
      serverSelectionTimeoutMS: 10000, // بدل ما يستنى للأبد ويسبب 504، يفشل بعد 10 ثواني برسالة واضحة
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log(`✅ MongoDB Connected: ${mongooseInstance.connection.host}`);
        return mongooseInstance;
      })
      .catch((error) => {
        // مهم: نصفّر الـ promise عشان المحاولة الجاية تقدر تعيد الاتصال
        // بدل ما تفضل عالقة على promise فاشلة للأبد
        cached.promise = null;
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        throw error; // بنرمي الخطأ بدل process.exit عشان الـ function تفضل حية
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;