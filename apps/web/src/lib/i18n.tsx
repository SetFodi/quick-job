'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Lang = 'en' | 'ru';

const dict = {
    // ───────── Navbar / Global ─────────
    nav: {
        signIn: { en: 'Sign in', ru: 'Войти' },
        getStarted: { en: 'Get Started', ru: 'Начать' },
        browseJobs: { en: 'Browse Jobs', ru: 'Все заказы' },
        postJob: { en: 'Post a Job', ru: 'Разместить заказ' },
        dashboard: { en: 'Dashboard', ru: 'Панель' },
    },

    // ───────── Landing ─────────
    landing: {
        badge: { en: 'Escrow-protected payments', ru: 'Платежи защищены эскроу' },
        heroLine1: { en: 'Work gets done.', ru: 'Работа выполнена.' },
        heroLine2: { en: 'Payment guaranteed.', ru: 'Оплата гарантирована.' },
        heroDesc: {
            en: 'Post a job, freeze the funds, get it done. Workers get paid only after you confirm. No risk. No scams. Just results.',
            ru: 'Размести заказ, заморозь деньги, получи результат. Исполнитель получает оплату только после подтверждения. Без рисков. Без обмана.',
        },
        startHiring: { en: 'Start Hiring', ru: 'Нанять исполнителя' },
        findWork: { en: 'Find Work', ru: 'Найти работу' },
        howItWorks: { en: 'How it works', ru: 'Как это работает' },
        howDesc: {
            en: 'Simple, transparent, and secure. From posting to payout in 4 steps.',
            ru: 'Просто, прозрачно и безопасно. От размещения до выплаты за 4 шага.',
        },
        step1Title: { en: 'Post a Job', ru: 'Размести заказ' },
        step1Desc: { en: 'Describe the work, set milestones and your budget.', ru: 'Опиши задачу, установи этапы и бюджет.' },
        step2Title: { en: 'Choose a Worker', ru: 'Выбери исполнителя' },
        step2Desc: { en: 'Workers bid on your job. Pick the best fit.', ru: 'Исполнители подают заявки. Выбери лучшего.' },
        step3Title: { en: 'Freeze Funds', ru: 'Заморозь средства' },
        step3Desc: { en: 'Money is locked in escrow. Worker can start safely.', ru: 'Деньги заблокированы в эскроу. Исполнитель начинает работу.' },
        step4Title: { en: 'Confirm & Pay', ru: 'Подтверди и оплати' },
        step4Desc: { en: 'Approve the work — payment releases instantly.', ru: 'Подтверди работу — оплата поступает мгновенно.' },
        trustTitle: { en: 'Built on trust', ru: 'Построено на доверии' },
        trustDesc: {
            en: "Workers don't work without money on the table. Clients don't pay without results. Our escrow system guarantees both sides are protected.",
            ru: 'Исполнители не работают без гарантии оплаты. Заказчики не платят без результата. Наша эскроу-система защищает обе стороны.',
        },
        trustItem1: { en: 'Funds frozen until work is done', ru: 'Средства заморожены до выполнения' },
        trustItem2: { en: 'Only 5% platform commission', ru: 'Комиссия платформы — всего 5%' },
        trustItem3: { en: 'Full transaction history', ru: 'Полная история транзакций' },
        footer: { en: 'All rights reserved.', ru: 'Все права защищены.' },
    },

    // ───────── Auth ─────────
    auth: {
        welcomeBack: { en: 'Welcome back', ru: 'С возвращением' },
        createAccount: { en: 'Create your account', ru: 'Создай аккаунт' },
        email: { en: 'Email', ru: 'Эл. почта' },
        password: { en: 'Password', ru: 'Пароль' },
        fullName: { en: 'Full name', ru: 'Полное имя' },
        iWantTo: { en: 'I want to...', ru: 'Я хочу...' },
        hireTalent: { en: 'Hire talent', ru: 'Нанять' },
        findWorkRole: { en: 'Find work', ru: 'Найти работу' },
        signInBtn: { en: 'Sign in', ru: 'Войти' },
        signingIn: { en: 'Signing in...', ru: 'Вход...' },
        createBtn: { en: 'Create account', ru: 'Создать аккаунт' },
        creating: { en: 'Creating account...', ru: 'Создаём аккаунт...' },
        noAccount: { en: "Don't have an account?", ru: 'Нет аккаунта?' },
        createOne: { en: 'Create one', ru: 'Создать' },
        haveAccount: { en: 'Already have an account?', ru: 'Уже есть аккаунт?' },
        signInLink: { en: 'Sign in', ru: 'Войти' },
        registered: { en: 'Account created! Check your email to confirm, then sign in.', ru: 'Аккаунт создан! Подтвердите email и войдите.' },
        subtitle: { en: 'Secure freelance marketplace', ru: 'Безопасная фриланс-площадка' },
    },

    // ───────── Dashboard ─────────
    dash: {
        title: { en: 'Dashboard', ru: 'Панель управления' },
        subtitle: { en: 'Manage your work and finances in one place.', ru: 'Управляй работой и финансами в одном месте.' },
        available: { en: 'Available Balance', ru: 'Доступный баланс' },
        frozen: { en: 'Escrow (Frozen)', ru: 'Эскроу (Заморожено)' },
        secureTitle: { en: 'Secure Payments', ru: 'Безопасные платежи' },
        secureDesc: {
            en: 'All your funds are held in a secure escrow until work is completed and approved.',
            ru: 'Все средства хранятся в безопасном эскроу до завершения и подтверждения работы.',
        },
        depositFunds: { en: 'Deposit Funds →', ru: 'Пополнить счёт →' },
        txHistory: { en: 'Transaction History', ru: 'История транзакций' },
        entries: { en: 'entries', ru: 'записей' },
        noTx: { en: 'No transactions yet. Start by depositing funds or accepting a job.', ru: 'Пока нет транзакций. Пополните счёт или примите заказ.' },
        myJobs: { en: 'My Jobs', ru: 'Мои заказы' },
        noJobs: { en: 'You have no active jobs yet.', ru: 'У вас пока нет активных заказов.' },
        asClient: { en: 'Client', ru: 'Заказчик' },
        asWorker: { en: 'Worker', ru: 'Исполнитель' },
        milestonesDone: { en: 'milestones done', ru: 'этапов выполнено' },
        viewJob: { en: 'View →', ru: 'Открыть →' },
    },

    // ───────── Jobs List ─────────
    jobsList: {
        title: { en: 'Open Jobs', ru: 'Открытые заказы' },
        subtitle: { en: 'Find your next opportunity', ru: 'Найди свой следующий заказ' },
        search: { en: 'Search jobs...', ru: 'Поиск заказов...' },
        all: { en: 'All', ru: 'Все' },
        construction: { en: 'Construction', ru: 'Строительство' },
        digital: { en: 'Digital', ru: 'Цифровые' },
        household: { en: 'Household', ru: 'Бытовые' },
        other: { en: 'Other', ru: 'Другое' },
        budget: { en: 'Budget', ru: 'Бюджет' },
        deadline: { en: 'Deadline', ru: 'Дедлайн' },
        noJobs: { en: 'No jobs found matching your criteria.', ru: 'Заказов по вашим критериям не найдено.' },
    },

    // ───────── Create Job ─────────
    createJob: {
        title: { en: 'Post a New Job', ru: 'Новый заказ' },
        subtitle: { en: 'Describe the work and set your milestones', ru: 'Опиши работу и установи этапы' },
        jobTitle: { en: 'Job Title', ru: 'Название' },
        category: { en: 'Category', ru: 'Категория' },
        description: { en: 'Description', ru: 'Описание' },
        totalBudget: { en: 'Total Budget ($)', ru: 'Общий бюджет ($)' },
        deadlineLabel: { en: 'Deadline', ru: 'Дедлайн' },
        milestones: { en: 'Milestones', ru: 'Этапы' },
        addMilestone: { en: '+ Add Milestone', ru: '+ Добавить этап' },
        milestoneName: { en: 'Milestone name', ru: 'Название этапа' },
        amount: { en: 'Amount', ru: 'Сумма' },
        budgetMatch: { en: 'Budget matches ✓', ru: 'Бюджет совпадает ✓' },
        budgetMismatch: { en: 'Milestone total must equal budget', ru: 'Сумма этапов должна совпадать с бюджетом' },
        submit: { en: 'Post Job →', ru: 'Разместить заказ →' },
        submitting: { en: 'Posting...', ru: 'Размещаем...' },
    },

    // ───────── Job Detail ─────────
    jobDetail: {
        backToJobs: { en: 'Back to Jobs', ru: 'К заказам' },
        postedBy: { en: 'Posted by', ru: 'Автор' },
        youAreClient: { en: '👤 You are the Client', ru: '👤 Вы — заказчик' },
        youAreWorker: { en: '🔧 You are the Worker', ru: '🔧 Вы — исполнитель' },
        proposals: { en: 'Proposals', ru: 'Заявки' },
        submitBid: { en: 'Submit Your Bid', ru: 'Подать заявку' },
        yourPrice: { en: 'Your Price ($)', ru: 'Ваша цена ($)' },
        coverLetter: { en: 'Cover Letter (optional)', ru: 'Сопроводительное письмо (необязательно)' },
        sendProposal: { en: 'Send Proposal', ru: 'Отправить заявку' },
        noProposals: { en: 'No proposals yet. Workers will bid on your job soon.', ru: 'Пока нет заявок. Исполнители скоро откликнутся.' },
        accept: { en: 'Accept', ru: 'Принять' },
        reject: { en: 'Reject', ru: 'Отклонить' },
        milestonesTitle: { en: 'Milestones', ru: 'Этапы' },
        fund: { en: 'Fund', ru: 'Финансировать' },
        submitWork: { en: 'Submit Work', ru: 'Сдать работу' },
        confirmPay: { en: 'Confirm & Pay', ru: 'Подтвердить и оплатить' },
        awaitingReview: { en: 'Awaiting Review', ru: 'На проверке' },
        jobCompleted: { en: 'Job Completed! 🎉', ru: 'Заказ выполнен! 🎉' },
        allMilestonesDone: { en: 'All milestones fulfilled and payments released.', ru: 'Все этапы выполнены, оплата произведена.' },
    },

    // ───────── Messages ─────────
    msgs: {
        title: { en: 'Messages', ru: 'Сообщения' },
        noChats: { en: 'No conversations yet', ru: 'Пока нет сообщений' },
        noChatsDesc: { en: 'Messages will appear when you work on a job.', ru: 'Сообщения появятся когда вы начнёте работу.' },
        typeMessage: { en: 'Type a message...', ru: 'Введите сообщение...' },
        send: { en: 'Send', ru: 'Отправить' },
        chat: { en: 'Chat', ru: 'Чат' },
    },

    // ───────── Status labels ─────────
    status: {
        pending: { en: 'Pending', ru: 'Ожидание' },
        funded: { en: 'Funded', ru: 'Оплачен' },
        review: { en: 'In Review', ru: 'На проверке' },
        completed: { en: 'Completed', ru: 'Завершён' },
        disputed: { en: 'Disputed', ru: 'Спор' },
        inProgress: { en: 'In Progress', ru: 'В работе' },
        assigned: { en: 'Assigned', ru: 'Назначен' },
        open: { en: 'Open', ru: 'Открыт' },
    },
} as const;

type Dict = typeof dict;
type DotPaths<T, Prefix extends string = ''> = T extends Record<string, any>
    ? {
        [K in keyof T & string]: T[K] extends { en: string; ru: string }
        ? `${Prefix}${K}`
        : DotPaths<T[K], `${Prefix}${K}.`>;
    }[keyof T & string]
    : never;

type TranslationKey = DotPaths<Dict>;

type LangContextType = {
    lang: Lang;
    toggle: () => void;
    t: (key: TranslationKey) => string;
};

const LangContext = createContext<LangContextType>({
    lang: 'ru',
    toggle: () => { },
    t: () => '',
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<Lang>('ru');

    const toggle = useCallback(() => {
        setLang((prev) => (prev === 'en' ? 'ru' : 'en'));
    }, []);

    const t = useCallback(
        (key: string): string => {
            const parts = key.split('.');
            let current: any = dict;
            for (const part of parts) {
                current = current?.[part];
            }
            return current?.[lang] ?? key;
        },
        [lang],
    );

    return (
        <LangContext.Provider value={{ lang, toggle, t }}>
            {children}
        </LangContext.Provider>
    );
}

export function useLang() {
    return useContext(LangContext);
}
