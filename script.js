// 1. 导航栏切换逻辑
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

// 2. 访问计数器 & 烟花彩蛋
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
            const countStr = mutation.target.innerText;
            if (/^1+$/.test(countStr)) {
                triggerFireworks();
            }
        }
    });
});

const counterElement = document.getElementById('busuanzi_value_site_pv');
if (counterElement) {
    observer.observe(counterElement, { childList: true });
}

function triggerFireworks() {
    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) { return Math.random() * (max - min) + min; }

    var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) { return clearInterval(interval); }
        var particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

// 获取页面上的 DOM 元素
const danmakuScreen = document.getElementById('danmaku-screen');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

// ==========================================
// 【关键】把下面这个链接，换成你刚刚复制的 API 地址！
// ==========================================
const LAF_API_URL = 'https://y05mszkaq2.sealoshzh.site/danmaku';

// 本地弹幕池（如果数据库没数据，就显示这些默认的）
let danmakuList = ["晚安，明天见", "有点累", "下雨了🌧️", "今天也要开心呀"];

// 1. 创建弹幕动画的函数
function createDanmaku(text, isSelf = false, isInitial = false) {
    const danmaku = document.createElement('div');
    danmaku.className = 'danmaku-item';
    danmaku.innerText = text;
    
    const screenHeight = danmakuScreen.clientHeight || 150;
    const maxTop = Math.max(screenHeight - 30, 0);
    danmaku.style.top = `${Math.floor(Math.random() * maxTop)}px`;
    
    let duration = isSelf ? 15 : Math.floor(Math.random() * 15) + 20;
    danmaku.style.animationDuration = `${duration}s`;

    if (isSelf) {
        danmaku.classList.add('self-danmaku');
        danmaku.style.zIndex = '10';
    } else {
        danmaku.style.zIndex = '1';
    }

    if (isInitial) {
        danmaku.style.animationDelay = `-${Math.random() * duration}s`;
    }
    
    danmakuScreen.appendChild(danmaku);
    danmaku.addEventListener('animationend', () => danmaku.remove());
}

// 2. 从云端获取历史留言 (GET 请求)
async function fetchDanmaku() {
    try {
        const response = await fetch(LAF_API_URL);
        const data = await response.json();
        
        // 如果数据库里有数据，就替换掉本地的默认弹幕池
        if (data && data.length > 0) {
            danmakuList = data.map(item => item.text);
        }

        // 初始随机飘过 5 条弹幕
        for (let i = 0; i < 5; i++) {
            const randomMsg = danmakuList[Math.floor(Math.random() * danmakuList.length)];
            createDanmaku(randomMsg, false, true);
        }
    } catch (err) {
        console.error("获取弹幕失败:", err);
    }
}

// 3. 发送新留言到云端 (POST 请求)
async function sendDanmakuToDB(text) {
    try {
        await fetch(LAF_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });
    } catch (err) {
        console.error("发送失败:", err);
    }
}

// 4. 启动！拉取云端数据
fetchDanmaku();

// 5. 设置定时器，每隔 4.5 秒自动飘过一条弹幕
setInterval(() => {
    if (danmakuList.length > 0) {
        const randomMsg = danmakuList[Math.floor(Math.random() * danmakuList.length)];
        createDanmaku(randomMsg, false, false);
    }
}, 4500);

// 6. 绑定发送按钮的点击事件 (带 3 秒防刷冷却)
let isCooldown = false;

sendBtn.addEventListener('click', () => {
    if (isCooldown) {
        messageInput.placeholder = "发送太快啦，休息一下~";
        return;
    }

    const text = messageInput.value.trim();
    if (text) {
        // 立即在本地屏幕上显示
        createDanmaku(text, true); 
        // 加入本地弹幕池
        danmakuList.push(text);
        // 【核心】异步发送到 Sealos 云端数据库
        sendDanmakuToDB(text); 
        
        // 清空输入框
        messageInput.value = '';
        
        // 触发 3 秒冷却时间
        isCooldown = true;
        sendBtn.style.opacity = '0.5';
        sendBtn.style.cursor = 'not-allowed';
        messageInput.placeholder = "弹幕发射中...";
        
        setTimeout(() => {
            isCooldown = false;
            sendBtn.style.opacity = '1';
            sendBtn.style.cursor = 'pointer';
            messageInput.placeholder = "输入弹幕，和大家打个招呼吧...";
        }, 3000);
    }
});

// 绑定回车键发送
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});

// 5. 留言引子滚动提示
const prompts = ["今天开心吗？", "留下你的足迹吧~", "最近有什么美食安利？", "建议这个网页记录些什么？"];
let promptIndex = 0;
setInterval(() => {
    promptIndex = (promptIndex + 1) % prompts.length;
    messageInput.placeholder = prompts[promptIndex];
}, 3000);