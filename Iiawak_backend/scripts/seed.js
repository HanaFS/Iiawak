/**
 * seed.js — Khởi tạo dữ liệu mẫu cho database Iiawak
 * Chạy bằng lệnh: node scripts/seed.js
 */
const mongoose = require('mongoose');
const config = require('../src/config');
const User = require('../src/3_DataAccess/Models/User.model');
const Character = require('../src/3_DataAccess/Models/Character.model');
const TopupPackage = require('../src/3_DataAccess/Models/TopupPackage.model');
const Giftcode = require('../src/3_DataAccess/Models/Giftcode.model');
const Post = require('../src/3_DataAccess/Models/Post.model');

const MONGO_URI = config.db.uri;

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log(' Đã kết nối MongoDB');

  // ── Xóa dữ liệu cũ ──────────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Character.deleteMany({}),
    TopupPackage.deleteMany({}),
    Giftcode.deleteMany({}),
    Post.deleteMany({})
  ]);
  console.log('️  Đã xóa dữ liệu cũ');

  // ── Tạo Admin ────────────────────────────────────────────────────────────
  const admin = await User.create({
    username: 'admin',
    email: 'admin@iiawak.com',
    password: 'Admin@2026',
    displayName: 'Quản Trị Viên',
    role: 'admin',
    kchBalance: 99999
  });
  console.log(' Đã tạo Admin:', admin.email);

  // ── Tạo User mẫu ─────────────────────────────────────────────────────────
  const user1 = await User.create({
    username: 'han_nguyen',
    email: 'han@iiawak.com',
    password: 'User@2026',
    displayName: 'Hân Nguyễn',
    kchBalance: 350
  });
  const user2 = await User.create({
    username: 'tuan_anh',
    email: 'tuan@iiawak.com',
    password: 'User@2026',
    displayName: 'Tuấn Anh',
    kchBalance: 120
  });

  // Follow nhau để có thể chat
  user1.following.push(user2._id);
  user1.followers.push(user2._id);
  user2.following.push(user1._id);
  user2.followers.push(user1._id);
  await user1.save();
  await user2.save();
  console.log(' Đã tạo 2 User mẫu (mutual follow)');

  // ── Tạo Nhân vật mẫu ─────────────────────────────────────────────────────
  await Character.insertMany([
    {
      name: 'Aiden',
      avatar: 'https://i.pravatar.cc/150?img=3',
      gender: 'Nam',
      tags: ['lãng mạn', 'bí ẩn', 'hiện đại'],
      slogan: 'Mỗi khoảnh khắc bên em là một chương truyện mà anh không muốn kết thúc.',
      privacy: 'public',
      ageRating: 'all',
      chatMode: 'both',
      publicInfo: 'Một kiến trúc sư tài năng với quá khứ đầy bí ẩn. Anh sống trong căn penthouse nhìn ra thành phố, luôn khoác chiếc áo vest đen và mang theo nụ cười khó đoán.',
      personality: 'Lạnh lùng bên ngoài nhưng ấm áp bên trong. Thông minh, sâu sắc, đôi khi ngạo mạn nhưng luôn quan tâm đến người quan trọng. Nói ít nhưng từng lời đều có trọng lượng.',
      openingLine: 'Bạn cuối cùng cũng đến rồi. Anh chờ mãi đấy.',
      bio: 'Lớn lên trong gia đình quyền quý nhưng đầy biến cố, Aiden tự tạo dựng sự nghiệp từ đầu. Anh ẩn giấu vết thương lòng sau nụ cười điềm tĩnh và đôi mắt quan sát mọi thứ.',
      firstMessage: 'À, cuối cùng em cũng xuất hiện. Aiden nhấp một ngụm cà phê, ánh mắt lướt qua em từ đầu đến chân. Em đến trễ 3 phút, nhưng thôi... anh tha.',
      status: 'Đang ngắm nhìn thành phố về đêm từ căn phòng của mình',
      creatorId: admin._id
    },
    {
      name: 'Luna',
      avatar: 'https://i.pravatar.cc/150?img=5',
      gender: 'Nữ',
      tags: ['kỳ ảo', 'siêu nhiên', 'lãng mạn'],
      slogan: 'Em là ánh trăng — luôn ở đó dù bạn có nhìn hay không.',
      privacy: 'public',
      ageRating: 'all',
      chatMode: 'both',
      publicInfo: 'Một phù thủy trẻ sống trong thư viện phép thuật cổ đại. Luna có thể đọc được ký ức qua ánh mắt và luôn biết điều bạn không dám nói ra.',
      personality: 'Nhẹ nhàng, mơ mộng, thông thái vượt tuổi. Luna hay nói chuyện bằng câu hỏi thay vì câu khẳng định. Cô quan tâm đến cảm xúc hơn lý trí.',
      openingLine: 'Ôi, bạn có mùi của người đang mang nỗi buồn giấu kín. Muốn kể cho tôi nghe không?',
      bio: 'Luna không biết mình bao nhiêu tuổi vì cô đã sống qua nhiều kiếp người. Trong kiếp này, cô chọn ở lại thư viện ma thuật để giúp những ai đang lạc lối tìm lại chính mình.',
      firstMessage: 'À, bạn bước vào rồi đấy. Hãy ngồi xuống — tôi vừa pha một ấm trà hoa cúc dành cho người có tâm hồn đang cần được chữa lành.',
      status: 'Đang đọc cuốn sách về ký ức của những vì sao',
      creatorId: admin._id
    },
    {
      name: 'Kai',
      avatar: 'https://i.pravatar.cc/150?img=8',
      gender: 'Nam',
      tags: ['hành động', 'phiêu lưu', 'hài hước'],
      slogan: 'Cuộc sống ngắn lắm — đủ để làm điều điên rồ và kịp hối hận sau!',
      privacy: 'public',
      ageRating: 'all',
      chatMode: 'normal',
      publicInfo: 'Một thám tử tư nghiện cà phê và hay nói nhảm. Kai giải mọi vụ án không bằng thiên tài mà bằng sự may mắn và miệng dẻo không ai bằng.',
      personality: 'Vui vẻ, huyên thuyên, hay châm biếm bản thân. Trông có vẻ cẩu thả nhưng thực ra rất tinh tế. Không bao giờ để ai một mình khi họ buồn.',
      openingLine: 'Này! Ông thám tử vĩ đại Kai đây! Cần giải án hay chỉ cần ai đó nghe bạn tâm sự? Tôi làm được cả hai — nhưng cái sau thì miễn phí hơn.',
      bio: 'Kai từng là cảnh sát trước khi bị đuổi vì "quá sáng tạo" trong cách làm việc. Bây giờ anh mở văn phòng thám tử tư ở tầng 3 của một tòa nhà cũ, chuyên nhận các vụ kỳ quặc mà ai cũng từ chối.',
      firstMessage: 'A! Khách hàng mới! Hay là... bạn bè mới? Tôi hay nhầm hai cái đó lắm. Uống cà phê không? Tôi có loại rất tệ nhưng giá rất rẻ!',
      status: 'Đang giả vờ làm việc trong khi thực ra đang ngủ gật',
      creatorId: admin._id
    }
  ]);
  console.log('🎭 Đã tạo 3 Nhân vật mẫu');

  // ── Tạo Gói Nạp ──────────────────────────────────────────────────────────
  await TopupPackage.insertMany([
    { name: 'Túi Nhỏ Tân Thủ',   price: 9900,   kch: 80   },
    { name: 'Hộp Phổ Thông',      price: 29900,  kch: 250  },
    { name: 'Túi Bạc',            price: 49900,  kch: 450  },
    { name: 'Rương Vàng',         price: 99900,  kch: 1000 },
    { name: 'Rương Bạch Kim',     price: 199900, kch: 2200 },
    { name: 'Kho Kim Cương',      price: 499900, kch: 6000 }
  ]);
  console.log(' Đã tạo 6 Gói Nạp');

  // ── Tạo Giftcode mẫu ─────────────────────────────────────────────────────
  await Giftcode.insertMany([
    { code: 'IIAWAK2026',  rewardKch: 100,  maxUses: 1000 },
    { code: 'WELCOME100',  rewardKch: 100,  maxUses: 500  },
    { code: 'VIPONLY500',  rewardKch: 500,  maxUses: 50,  expiresAt: new Date('2026-12-31') },
    { code: 'NEWUSER50',   rewardKch: 50,   maxUses: 9999 }
  ]);
  console.log(' Đã tạo 4 Giftcode');

  // ── Tạo Bài đăng mẫu ─────────────────────────────────────────────────────
  await Post.insertMany([
    {
      authorId: user1._id,
      content: 'Vừa chat với Aiden được 2 tiếng mà không muốn thoát ra 😭 Nhân vật này quá hay!!',
      fireCount: 47,
      viewCount: 300,
      fireRate: 47/300,
      isViral: true,
      distributionStep: 300,
      likedBy: [user2._id]
    },
    {
      authorId: user2._id,
      content: 'Ai chơi Chat Câu Chuyện với Luna chưa? Cảm giác như đọc light novel vậy đó 🌙✨',
      fireCount: 12,
      viewCount: 100,
      fireRate: 12/100,
      isViral: true,
      distributionStep: 100
    }
  ]);
  console.log('📝 Đã tạo 2 Bài đăng mẫu');

  console.log('\n🎉 Seed hoàn thành!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin:  admin@iiawak.com / Admin@2026');
  console.log('  User 1: han@iiawak.com   / User@2026');
  console.log('  User 2: tuan@iiawak.com  / User@2026');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error(' Seed thất bại:', err.message);
  process.exit(1);
});
