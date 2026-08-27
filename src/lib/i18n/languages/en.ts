export const en = {
  common: {
    ok: "OK",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    delete: "Delete",
    close: "Close",
    back: "Back",
    more: "More",
    loading: "Loading...",
    viewAll: "View all",
    search: "Search",
    submit: "Submit",
    send: "Send",
    verify: "Verify",
    retry: "Retry",
    continue: "Continue",
    create: "Create",
    edit: "Edit",
    publish: "Publish",
    optional: "Optional",
    or: "Or",
    yes: "Yes",
    no: "No",
    none: "None",
    today: "Today",
  },

  messages: {
    networkError: "Network connection failed, please try again later",
    requestFailed: "Request failed ({status})",
    requestTimeout: "Request timed out",
    timeoutOrCancelled: "Request timed out or was cancelled",
    networkRequestFailed: "Network request failed: {error}",
    unknownError: "Unknown error",
    unknownNetworkError: "Unknown network error",
    httpError: "HTTP {status}",
    operationFailed: "Operation failed, please try again",
    auth: {
      wrongCredentials: "Incorrect account or password",
      loginSuccess: "Logged in",
      codeSent: "Verification code sent, please check your inbox",
      magicLinkSent: "Magic Link sent, please check your inbox",
      passkeyFirstTime2fa:
        "This is your first login and 2FA setup is required. Please scan the QR code.",
      githubAuthorizationFailed: "Failed to start GitHub authorization",
      passkeyLoginFailed: "Passkey login failed",
      missingTempToken: "Missing temporary session token, please log in again",
      passkeyViaLoginPage:
        'Please use the "Passkey" method on the login page to complete authentication',
      unsupportedLoginMethod: "Unsupported login method",
      unsupportedRegisterType: "Unsupported registration type",
    },
    recovery: {
      enterAccount: "Enter the email or phone number you registered with",
      enterCode: "Please enter the verification code",
      missingSessionToken:
        "Missing temporary session token, please start recovery again",
      enterSixDigitTotp: "Please enter the 6-digit one-time code",
      passwordTooShort: "Password must be at least 6 characters",
      passwordMismatch: "The two passwords do not match",
      resetSuccess: "Password reset, please log in",
    },
    register: {
      usernameTooShort: "Username must be at least 3 characters",
      usernameTooLong: "Username cannot exceed 50 characters",
      usernameSpecialChars:
        "Username cannot contain special characters (such as < > /)",
      passwordTooShort: "Password must be at least 6 characters",
      passwordTooLong: "Password cannot exceed 128 characters",
      passwordMismatch: "The two passwords do not match",
      enterEmail: "Please enter your email",
      enterPhone: "Please enter your phone number",
      contactSpecialChars: "Contact info cannot contain special characters",
      invalidEmail: "Please enter a valid email address",
      invalidPhone: "Please enter a valid phone number",
      codeRequestFailed:
        "Failed to get the verification code, please try again",
      sessionExpired: "Registration session expired, please resubmit",
      invalidCodeLength: "Incorrect verification code length",
      invalidCodeFormat: "Incorrect verification code format",
    },
    webauthn: {
      browserOnly:
        "WebAuthn is only available in a browser environment. Please use a supported browser with HTTPS or localhost.",
      createFailed: "Failed to create passkey",
      authenticateFailed: "Passkey authentication failed",
    },
    mfa: {
      stepUpDialogTitle: "Two-Factor Verification",
      stepUpDialogMessage:
        "This action requires two-factor verification. Enter the 6-digit code from your authenticator app to continue (no repeat within 1 hour).",
      codePlaceholder: "6-digit code",
      verifyButton: "Verify",
      invalidCode: "Invalid code, please try again",
      useRecovery: "Can't verify / lost device? Use a backup recovery code",
      useTotp: "Back to security code",
      recoveryPlaceholder: "Enter a backup recovery code",
    },
    blog: {
      fetchSeriesFailed: "Failed to load blog series: {error}",
    },
    articles: {
      categories: {
        announcement: "Announcement",
        architecture: "Architecture",
        security: "Security",
        engineering: "Engineering",
        ai: "AI",
        community: "Community",
        culture: "Culture",
        news: "Tech News",
        science: "Science",
      },
    },
    admin: {
      sessionExpired: "Admin session expired",
      mfaRequired:
        "This action requires two-factor verification. Please complete it and try again.",
      requestFailed: "Request failed",
      requestFailedStatus: "Request failed ({status})",
    },
    errorBoundary: {
      title: "Failed to load the page",
      message: "Please refresh the page and try again",
      reload: "Refresh",
    },
  },

  nav: {
    home: "Home",
    about: "About",
    archive: "Archive",
    navigation: "Navigation",
    mainNav: "Main navigation",
    closeMenu: "Close menu",
    mobileNav: "Mobile navigation",
    news: "News",
    help: "Help",
    team: "Team",
    resources: "Resources",
    mine: "My",
    intro: "Introduction",
    teamMembers: "Team members",
    timeline: "Timeline",
    feedTimeline: "Activity Timeline",
    follow: "My Follows",
    recentUpdates: "Recent updates",
    faq: "FAQ",
    officialAnnouncement: "Announcements",
    techNews: "Tech news",
    science: "Science",
    articleList: "Articles",
    allCategories: "All categories",
    articleArchive: "Archive",
    aboutArticles: "About articles",
    managementTeam: "Management team",
    projectTeam: "Project team",
    qqCommunity: "QQ community",
    aboutUs: "About us",
    services: "Services",
    sponsorship: "Sponsorship",
    contactUs: "Contact us",
    blog: "Blog",
    blogList: "Blog list",
    aboutBlog: "About blog",
    community: "Community",
    communityHome: "Community Home",
    forum: "Forum",
    columns: "Columns",
    fileLibrary: "Files",
    qa: "QA",
    projects: "Projects",
    competition: "Competition",
    funding: "Funding",
    moreApps: "More apps",
    profile: "Profile",
    contribution: "Contribution",
    settings: "Settings",
  },

  footer: {
    community: "Community",
    pages: "Pages",
    legal: "Legal",
    supportUs: "Support Us",
    privacyPolicy: "Privacy Policy",
    terms: "Terms of Service",
    copyright: "LKM &copy; 2026 · All rights reserved.",
  },

  blog: {
    tags: "Tags",
    categories: "Categories",
    recentPosts: "Recent Posts",
    rssSubscribe: "RSS",
    collapse: "Collapse",
    prev: "Previous",
    next: "Next",
    comments: "Comments",
    untitled: "Untitled",
    uncategorized: "Uncategorized",
    noTags: "No Tags",
    wordCount: "word",
    wordsCount: "words",
    minuteCount: "minute",
    minutesCount: "minutes",
    postCount: "post",
    postsCount: "posts",
    author: "Author",
    publishedAt: "Published at",
    license: "License",
    title: "Blog",
    noArticles: "No articles",
    noArticlesYet: "No articles yet",
    seriesEmpty: "This series has no articles yet",
    articleListTitle: "Article list",
    articleCount: "{count} articles",
    categoryArticleCount: "{count} articles",
    seriesActive: "Active",
    seriesArchived: "Archived",
    starCount: "{count} favorites",
    updatedAt: "Updated on {date}",
    newArticle: "New article",
    editArticle: "Edit",
    editArticleFull: "Edit this article",
    readingMeta: "{words} words · {minutes} minutes",
    postNotFound: "Blog post not found",
    postNotExist: "The blog post does not exist",
    wordsValue: "{count} words",
    minutesValue: "{count} minutes",
    commentsCount: "Comments ({count})",
    noComments: "No comments yet",
    commentPlaceholder: "Write your thoughts...",
    reply: "Reply",
    replyTo: "Reply to: {name}",
    deleteCommentStepUpHint:
      "Deleting this comment requires two-factor verification. Enter the 6-digit code from your authenticator app (no repeat within 1 hour).",
    sending: "Sending...",
    loginPromptPrefix: "Please ",
    loginPromptSuffix: " to comment",
    readerComments: "Reader Comments",
    commentsLoading: "Loading comments...",
    giscusNeedsConfig: "Comments require Giscus configuration.",
    giscusConfigure: "Configure",
    viewComments: "View comments",
    like: "Like",
    unlike: "Unlike",
    aboutTitle: "About",
    aboutMaintainer: "Maintainer: ",
    categoriesTitle: "Article Categories",
    tagsTitle: "Article Tags",
    archiveTitle: "Article Archive",
    searchTitle: "Search Blog",
    searchPlaceholder: "Search article titles or series...",
    searchHint: "Type a keyword to search blog articles",
    searchNoResults: "No related articles found",
    homeSubtitle: "Technical sharing and reflections from community members",
    prevPage: "Previous page",
    nextPage: "Next page",
    share: {
      share: "Share",
      wechat: "Share to WeChat",
      qq: "Share to QQ",
      weibo: "Share to Weibo",
      copyLink: "Copy link",
      copyLinkAria: "Copy article link",
      more: "More share options",
      wechatScanTitle: "Scan to share on WeChat",
      wechatScanHint:
        'Open WeChat "Scan" and scan the QR code to share this article',
      linkCopied: "Link copied",
      qrLoadFailed: "Failed to load QR code",
    },
  },

  admin: {
    title: "Admin Panel",
    loadFailed: "Failed to load",
    pagination: "{total} items · Page {page} / {totalPages}",
    prevPage: "Previous",
    nextPage: "Next",
    backToSite: "Back to Site",
    console: {
      overview: "Overview",
      trend: "Trend",
      activity: "Recent Activity",
      shortcuts: "Quick Actions",
    },
    sidebar: {
      dashboard: "Dashboard",
      users: "User Management",
      posts: "Post Management",
      files: "File Review",
      categories: "Board Management",
      reports: "Report Management",
      moderation: "Auto Moderation",
    },
    saved: "Saved",
    deleted: "Deleted",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    mfaTitle: "Two-Factor Verification Required",
    mfaHint: "Enter your verification code to confirm this action.",
    mfaCodePlaceholder: "Verification code",
    mfaInvalidCode: "Invalid or expired code",
    moderation: {
      title: "Auto Moderation Rules",
      addRule: "Add Rule",
      noRules: "No rules yet",
      pattern: "Pattern",
      action: "Action",
      weight: "Weight",
      regex: "Regex",
      status: "Status",
      enabled: "On",
      disabled: "Off",
      editRule: "Edit Rule",
      patternPlaceholder: "Keyword / domain / regex",
      isRegex: "Regular expression",
      testRules: "Test Rules",
      testPlaceholder: "Enter text to evaluate",
      runTest: "Run Test",
      testMatched: "Matched: would be moderated",
      testClean: "Clean: no rule matched",
      penalty: "Penalty {value}",
      shouldHide: "Should Hide",
      totalRules: "{count} active rules",
    },
    login: {
      subtitle: "Administrator Login · LKM",
      required: "Please enter username and password",
      success: "Login successful, entering the admin panel...",
      failed: "Login failed",
      username: "Username",
      usernamePlaceholder: "Enter administrator username",
      password: "Password",
      passwordPlaceholder: "Enter password",
      submit: "Log in",
    },
    stats: {
      users: "Registered Users",
      posts: "Total Posts",
      files: "Total Files",
      pendingFiles: "Files Pending Review",
      pendingReports: "Pending Reports",
    },
    trend: {
      users: "New Users",
      posts: "New Posts",
    },
    shortcuts: {
      reviewFiles: "Review Files",
      reviewReports: "Review Reports",
      manageUsers: "Manage Users",
      managePosts: "Manage Posts",
      backToSite: "Back to Site",
    },
    activity: {
      latestUsers: "Newest Users",
      latestPosts: "Newest Posts",
      latestReports: "Newest Reports",
      empty: "No data yet",
    },
    users: {
      searchPlaceholder: "Search by username",
      showPii: "Show email/phone",
      username: "Username",
      level: "Level",
      email: "Email",
      status: "Status",
      createdAt: "Registered At",
      locked: "Locked",
      active: "Active",
      empty: "No users",
    },
    userLevel: {
      local: "Local",
      normal: "Regular",
      admin: "Admin",
    },
    files: {
      all: "All",
      filename: "File Name",
      uploader: "Uploader",
      size: "Size",
      status: "Status",
      uncategorized: "Uncategorized",
      empty: "No files",
    },
    fileStatus: {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
    },
    posts: {
      title: "Title",
      category: "Board",
      views: "Views",
      createdAt: "Time",
      empty: "No posts",
    },
  },

  profile: {
    followers: "{count} followers",
    following: "Following {count}",
    points: "{points} points",
    follow: "Follow",
    message: "Message",
    motto: "Motto",
    notFilled: "Not filled in",
    major: "Major",
    grade: "Grade",
    interests: "Interests",
    ideals: "Ideals",
    tabPosts: "Posts",
    tabProjects: "Projects",
    tabColumns: "Columns",
    noPosts: "No posts yet",
    noProjects: "No projects yet",
    columnNotEnabled: "Column feature not enabled yet",
    unlockColumn: "Unlock columns via quiz →",
    noColumnArticles: "No column articles yet",
    notFound: "User does not exist or failed to load",
  },

  contribution: {
    me: "Me",
    title: "Contribution System",
    currentPoints: "Current Points:",
    columnAuthor: "Column Author",
    tabAchievements: "Achievements",
    tabPoints: "Points Detail",
    tabLeaderboard: "Leaderboard",
    tabExchange: "Exchange",
    tabTasks: "Task Center",
    virtual: "Virtual",
    physical: "Physical",
    lowStock: "Only {stock} left",
    pointsCost: "{points} points",
    soldOut: "Sold out",
    exchange: "Exchange",
    dailyCheckin: "Daily Check-in",
    checkinStreak: "Check-in streak: {days} days",
    checkedIn: "Checked in today ✓",
    checkinReward: "Check in +{points} points",
    dailyTasks: "Today's Tasks",
    taskReward: "Reward {points} points",
    periodDaily: "Daily",
    periodWeekly: "Weekly",
    periodTotal: "All-time",
    pointsSuffix: "{points} pts",
    exchangeSuccess:
      'Exchange successful! You spent {points} points on "{name}"',
  },

  follow: {
    follow: "Follow",
    unfollow: "Unfollow",
    loginToFollow: "Login to follow",
    followingUsers: "Following Users ({count})",
    followingBoards: "Following Boards ({count})",
    emptyUsers: "You are not following anyone yet.",
    emptyBoards: "You have not followed any boards yet.",
  },

  timeline: {
    title: "Timeline",
    refresh: "Refresh",
    follow: "Following",
    hot: "Popular",
    empty: "Nothing here yet.",
    loadMore: "Load more",
    type: {
      forum: "Forum",
      article: "Article",
      column: "Column",
      qa: "QA",
      project: "Project",
    },
  },

  notification: {
    title: "Notifications",
    markAllRead: "Mark all as read",
    empty: "No notifications",
    justNow: "just now",
    minutesAgo: "{count} minutes ago",
    hoursAgo: "{count} hours ago",
    daysAgo: "{count} days ago",
  },

  share: {
    twitter: "Share to X (Twitter)",
    facebook: "Share to Facebook",
    linkedin: "Share to LinkedIn",
    whatsapp: "Share to WhatsApp",
    email: "Share via Email",
  },

  team: {
    clickToCopy: "Click to copy",
    copied: "Copied!",
    channelId: "Channel ID: ",
    communities: {
      general: {
        label: "General Enthusiasts Group",
        intro:
          "A big family that belongs to no specific major, with no restrictions on job type, grade level, or skill level — everyone is welcome to join! Chat about everyday life, actively discuss problems when they come up, and feel free to share your studies and life~",
        oneGroup: {
          name: "Group 1",
          desc: "This is the LKM main discussion group, one of the official groups of the Tencent Physics Tribe. It is a very large general group, welcoming students, teachers, engineers, professionals from all walks of life, science communicators, and researchers who are interested in science and engineering. Here you can discuss academic subjects, popular science, studies and life, thoughts and culture — let us learn and grow together~",
        },
        twoGroup: {
          name: "Group 2",
        },
        qqChannel: {
          name: "QQ Channel",
          desc: "The official QQ Channel, created to ease the pressure on the large QQ community. Use it to ask questions and share your daily life and check-ins~~",
        },
      },
      grades: {
        label: "Grade-based Groups",
        intro:
          "The organization has members at all different stages of learning. So that everyone can find people to talk to, we have separate junior high and senior high groups; university students can join the major-specific groups as needed.",
        junior: {
          name: "Junior High",
          desc: "The kids in the junior high group are quite active — interesting and fun, a bunch of very lovely kids, and some of them are even far ahead of high schoolers. If you strike up a conversation with them, they will be more than happy to respond. The organization provides problem-solving help, middle school exam guidance, and tutoring for junior high students, helping them face the first big selection exam of their lives.",
        },
        junior2: {
          name: "Junior High Group 2",
          desc: "Group 1 was so active that letting more people in would hurt the current comfort level, so everyone is welcome to join Junior High Group 2! The group is new, but its admins are quite dedicated. Come on in and have fun!",
        },
        senior: {
          name: "Senior High (Group 1 is full)",
          desc: "High schoolers in this group are a bit more serious and focused on their studies, discussing high school life and topics related to the college entrance exam. The organization offers major recommendations, academic planning, and analysis of past exam papers for senior high students.",
        },
        senior2: {
          name: "Senior High Group 2",
          desc: "The file folder in Group 1 is currently full, so if you need to share files, head over to Group 2. Group 2 may have fewer members, but most of them are active. Group 2 is still under construction — everyone is welcome to build and share together!",
        },
        senior3: {
          name: "Senior High Group 3",
          desc: "Group 3 has its own distinctive character. A mature and proactive management team is frequently online, and the group is very active. It is perfect for those who want company through exams or to share their high school life. Welcome aboard!",
        },
      },
      groups: {
        label: "Groups by Community Role",
        intro:
          "All are welcome — science communicators, researchers, educators, engineers from every industry, companies, and social organizations. In the future we aim to drive research commercialization, project facilitation, and incubation. Groups are organized by ideas or industry to give everyone a better space to discuss.",
        academic: {
          name: "Academic Exchange Group",
          desc: "Welcome to those with academic ambitions who want to enter research, or who are already in research. We plan to host academic lectures and same-field exchanges in the future. However, since this group currently mixes many disciplines and its supporting structure is not yet complete, we suggest joining the corresponding major-specific groups instead.",
        },
        language: {
          name: "Language Society for International Science Exchange",
          desc: "This group is mainly for language exchange and learning, such as the English, Russian, and German skills needed for reading literature. As the group grows, it will be split further by language. International students, exchange students, foreign friends, and those aspiring to careers in translation or diplomacy are all welcome. In the future this will serve science and technology exchange at home and abroad.",
        },
      },
      basic: {
        label: "Natural / Basic Sciences Central Group",
        intro:
          "The natural and basic sciences are the foundation of everything; applied sciences take root here and branch out into countless fields. Science enthusiasts interested in the basic sciences are welcome to join!",
        math: {
          name: "Mathematics",
          desc: "For those interested in mathematics or working in the field. Math enthusiasts can discuss their favorite mathematical topics and cutting-edge content here. The group is generally active with solid expertise. Everyone is welcome to join in learning, discussion, and chat!",
        },
        physics: {
          name: "Physics & Astronomy",
          desc: "For those interested in physics and astronomy or working in the field — e.g., physics, applied physics, acoustics, systems science and engineering, quantum science, astrophysics, astrometry, and celestial mechanics. The group's expertise is top-notch. Members may be busy and the group can seem quiet, but the file and knowledge repositories are rich, and someone will always answer your questions.",
        },
        chemistry: {
          name: "Chemistry",
          desc: "For those interested in chemistry or working in the field — e.g., chemistry, applied chemistry, chemical biology, molecular science and engineering, energy science, molecular metrology and technology, and resource chemistry. Chemistry enthusiasts can discuss freely. Though the group is small and its most skilled members are busy, questions are almost always answered.",
        },
        biology: {
          name: "Life Sciences",
          desc: "The life sciences cover a very broad range of fields, including biology, medicine, agriculture, environmental science, and more. Currently the group has few members, but they are very focused. Once publicity reaches the right audience, medicine will be split into its own group.",
        },
        earth: {
          name: "Earth Sciences General Group",
          desc: "Earth science is a comprehensive discipline covering many basic sciences and interdisciplinary fields. It focuses on the processes, changes, and interactions within the Earth system (atmosphere, hydrosphere, lithosphere, biosphere, and the Sun–Earth space). Related fields include geology, geophysics, geochemistry, geography, atmospheric science, and oceanography.",
        },
        social: {
          name: "Social Sciences",
          desc: "Mainly covers philosophy, politics, history, economics, and law. The ideological leaning is largely Marxist-Leninist-Maoist, encouraging study and engagement — connecting theory with practice in reality. Intellectuals, workers, comrades, teachers, researchers, and enthusiasts interested in these topics are all welcome.",
        },
        literature: {
          name: "Literature",
          desc: "A newly founded group, mainly giving literature-loving members a place to discuss. Here you can talk about literary works, appreciate the classics, and brainstorm your own writing. Those who have been eagerly waiting for a literature group finally have a home — welcome aboard!",
        },
      },
      applied: {
        label: "Applied Sciences",
        intro:
          "The applied sciences are still under construction with few members. If you want to lead a subject area and build up and promote the topics you are passionate about in your field, feel free to reach out and join the LKM team! LKM needs you!",
        info: {
          name: "Information Science and Technology General Group",
          desc: "The ACM general group, covering computer science, the internet, software development, algorithm research, large models, data processing, cybersecurity, and more. Anyone interested is welcome to join! In the future we will also develop more content, such as programming tutorials and hands-on projects.",
        },
        ieee: {
          name: "IEEE General Group",
          desc: "IEEE is the Institute of Electrical and Electronics Engineers, the world's largest technical professional organization. This group welcomes professionals in electrical engineering, automation, communications engineering, electronic science and technology, optics and optoelectronics, and related fields to join the discussion!",
        },
        chip: {
          name: "Integrated Circuits and Semiconductors",
          desc: "Integrated circuits and semiconductors form a hardcore circle with extremely high technical barriers and strong professional specialization, so they have their own group. Chip design, wafer fabrication, packaging and design, semiconductor, and IC enthusiasts and professionals are all welcome!",
        },
        engineering: {
          name: "Engineering General Group",
          desc: "Engineering is fundamentally about applying mathematics, the natural sciences, economics, and sociology to industrial and agricultural production in order to design, build, and optimize useful objects, systems, or structures. It covers civil engineering, mechanical engineering, transportation, and safety science and engineering. As the group grows, more specialized engineering subgroups will be created under the general group. Stay tuned~",
        },
        agriculture: {
          name: "Agronomy and Food Science General Group",
          desc: "Agronomy focuses on crop production and genetic breeding, while food science emphasizes food processing and safety control. It covers agronomy, applied bioscience, food science, agricultural engineering, and more. Anyone interested is welcome to join!",
        },
        energy: {
          name: "Environmental and Energy Science General Group",
          desc: "A general group combining environmental science and energy science. It covers environmental science, energy engineering, resource recycling, emerging interdisciplinary fields, and more. Both the interested and the professionally trained are welcome!",
        },
        lightIndustry: {
          name: "Light Industry General Group",
          desc: "This is the LKM · Academic · Applied Sciences · Light Industry General Group discussion group, one of the official groups of the Tencent Physics Tribe. It welcomes students, teachers, light industry professionals, researchers, science communicators, and technology enthusiasts who are interested in or study textiles, light industry engineering, packaging engineering, flavor and fragrance technology engineering, cosmetics technology engineering, biomass energy and materials, biomass technology and engineering, and more.",
        },
        geoscience: {
          name: "Geoscience Engineering General Group",
          desc: "This is the LKM · Academic · Applied Sciences · Geoscience General Group discussion group, one of the official groups of the Tencent Physics Tribe. It welcomes majors, teachers, geoscience professionals, researchers, science communicators, and technology enthusiasts who are interested in or study surveying and mapping, geology, mining, safety science and engineering, and more.",
        },
        medicine: {
          name: "Medicine Headquarters",
          desc: "This is the LKM · Academic · Medicine · Medicine General Group discussion group, one of the official groups of the Tencent Physics Tribe. It welcomes medical students, teachers, healthcare professionals, researchers, science communicators, and technology enthusiasts who are interested in or study traditional Chinese medicine, clinical medicine, pharmacy, nursing, stomatology, medical imaging, anesthesiology, and forensic medicine.",
        },
        clinical: {
          name: "Clinical Medicine School",
          desc: "This is the LKM · Academic · Medicine · Clinical Medicine General Group discussion group, one of the official groups of the Tencent Physics Tribe. It welcomes medical students, medical teachers, healthcare professionals, researchers, science communicators, and technology enthusiasts who are interested in or study clinical medicine, anesthesiology, medical imaging, ophthalmology and optometry, psychiatry, radiation medicine, pediatrics, and more.",
        },
        tcm: {
          name: "Traditional Chinese Medicine School",
          desc: "This is the LKM · Academic · Medicine · Traditional Chinese Medicine General Group discussion group, one of the official groups of the Tencent Physics Tribe. It welcomes medical students, medical teachers, healthcare professionals, researchers, science communicators, and technology enthusiasts who are interested in or study basic theory of TCM, diagnostics of TCM, internal medicine of TCM, surgery of TCM, osteology and traumatology of TCM, gynecology of TCM, pediatrics of TCM, otorhinolaryngology of TCM, acupuncture-moxibustion and tuina, and ethnic medicine.",
        },
      },
      hobby: {
        label: "Interest Group Clubs",
        intro:
          "Clubs formed around the various hobbies of our members. If any of these interest you, join in the fun! There are activities every winter and summer break.",
        chess: {
          name: "Chess & Cards Club",
          desc: "Discuss traditional, competitive, casual, and other board games, including (but not limited to) Chinese chess, Go, Gomoku, checkers, and Ludo. Discussions of strategy and the finer points of the games are also welcome — this is a place for players to spar and talk. As for cards, there are poker, traditional Chinese playing cards, modern trading card games (TCG) and tabletop card games, traditional dominoes, and more. Chess and card players, welcome aboard!",
        },
        game: {
          name: "Game Club",
          desc: "Mainly discusses gaming topics — consoles like PS, Xbox, and Switch; PC platforms like Steam and the Epic Games Store; and online games such as HoYoverse open-world titles. It is a space to talk games, make gaming friends, and team up for sessions~",
        },
        scifi: {
          name: "Science Fiction Literature Club",
          desc: "Our love for and pursuit of technology has never stopped, and neither has our imagination of the sci-fi world — what would the world really be like in an age of extreme technological advancement? Come discuss your ideas and sci-fi writing here! Join the Sci-Fi Club — it is all part of the plan!",
        },
        rhythm: {
          name: "Rhythm Game Club (Anime-style)",
          desc: "The Cooking Club mainly explores the chemical reactions behind cooking, for sharing culinary skills and showing off your homemade dishes. In the future, if possible, we will also host live streams and tutorials on cooking.",
        },
        cooking: {
          name: "Cooking Club",
          desc: "The Cooking Club mainly explores the chemical reactions behind cooking, for sharing culinary skills and showing off your homemade dishes. In the future, if possible, we will also host live streams and tutorials on cooking.",
        },
        music: {
          name: "Tubie Music Club",
          desc: "This group is not limited to LKM members themselves — others and professional music lovers are also welcome to discuss music theory and vocal basics, instrument exchange and teaching, music creation, music appreciation, and related topics. The group also organizes LKM galas and various event preparations, giving everyone a bigger and better stage~~",
        },
      },
      events: {
        label: "Recurring Activity Groups",
        summerCompetition: {
          name: "Summer Competition Activity Group",
          desc: "A group for preparing and announcing competitions. Every holiday, different contests are announced here. If you are interested in competitions, join and wait for the announcements.",
        },
        checkin: {
          name: "Self-discipline Check-ins & Study Rooms",
          desc: "Self-discipline check-ins and study rooms are also recurring activities of ours. Everyone is welcome to keep up self-discipline, health, and good daily routines here, and to study, exchange ideas, and discuss together.",
        },
      },
      legacy: {
        label: "Legacy Groups",
        intro:
          "This group cannot change its owner right now, meaning the management team cannot be replaced, so it feels a bit ancient and deserted. But it holds great sentimental value — LKM's rise in 2014 was built on the promotion of the Physics Tribe.",
        physicsTribe: {
          name: "Physics Tribe",
        },
      },
    },
    roles: {
      founder: "Founder",
      regular: "Resident",
      leader: "Leader",
      president: "President",
      groupLeader: "Group Leader",
      generalMember: "General Affairs Group Member",
      affairsSupervisor: "Community Affairs Supervisor",
      specialist: "Specialist",
      specialistAdvisor: "Specialist / Advisory Group Member",
      affairsGroupLeader: "Community Affairs Group Leader",
      level18Admin: "Level-18 Admin",
      infoGroupAdmin: "Information Group Admin",
      affairsMember: "Community Affairs Group Member",
      generalSpecialist: "General Affairs Specialist",
      advisorMember: "Advisory Group Member",
    },
    members: {
      keke: {
        desc: "On August 1, 2014, Ke Qi founded the very first group chat — the LKM Homestead. He is the original founder of LKM; much of what the group has today — its systems and frameworks — was built on what he did. Ke Qi founded Tencent's Physics Tribe and the WeChat official account, attracting a large number of tech enthusiasts, and put together the first LKM subgroup system and the July Team management structure. In 2018 he gradually stepped back for academic reasons, but everything about LKM stems from what he started.",
        quote:
          "「Ke Qi may not be here now, but he is without a doubt LKM's original founder.」",
        dream: "Dream: Let knowledge flow into every household",
      },
      julyHua: {
        desc: "A PhD with a vision",
        dream: "Dream: Every child can be exposed to science",
      },
      julyRobin: {
        desc: "To be filled in — still a student settling in (let us look forward to their growth~",
      },
      julyAhong: {
        desc: "To be filled in — still a student settling in (let us look forward to their growth~",
      },
      julyMoran: {
        desc: "Physics from a non-elite university, currently switching fields",
        dream: "Dream: I will surely be buried deep in snow",
        quote:
          "— For three thousand days of patience and resolve, buried deep in snow until turning to gold",
      },
      julyYouzhi: {
        desc: "A little black cat, former member of the Event Planning Group and executive of the junior high seminars",
        dream: "Dream: Eat well, drink well, sleep well, and have fun",
        quote:
          "— Pause, forget, and go with the wind; keep moving, keep observing, and stay at ease",
      },
      julyKomoyume: {
        desc: "Roboticist",
        dream: "Dream: Technology changes the world",
        quote: "— A salute to you, who still holds such hope for this world",
      },
      julyQianxun: {
        desc: "Joined LKM in 2019 while in the second year of junior high. Now I am a soon-to-be wage worker. Though I too was full of dreams back then, not everyone can become a scientist~˶>ᗜ<˶ Whether it is the seniors from back then or the juniors younger than me now, I do not want my regrets to fall on them. I also hope more people in the future will come to love science and engineering and will not give up on them as easily as I did.",
        dream:
          "Dream: The long-term vision is to make LKM bigger and stronger, achieve its ultimate goals, and live out its mission. But the immediate priority is the short-term goal — building a mature and complete online management team.",
      },
      julyZhishui: {
        desc: "Studying hard~",
      },
      julyQinghan: {
        desc: "Classified awa",
        dream: "Dream: No obligation to disclose",
        quote: "— WELCOME TO OUR KINGDOM!",
      },
      julyXia: {
        desc: "I am a little Xia",
        dream: "Dream: Become an encyclopedia",
        quote: "— To the imperfect tomorrow",
      },
      julyQingqian: {
        desc: "A bit of a lurker with not much knowledge in stock (",
        dream: "Dream: Become a researcher",
      },
      julyMk: {
        desc: 'Born in the 2010s, just call me MK. Currently learning Japanese and love math (not a pro, meow). My favorite anime character is Elaina from "Wandering Witch: The Journey of Elaina". Bilibili UID: 1929696645',
        dream: "Dream: An UP with a million followers",
        quote: "— You should... Never Give Up!",
      },
      julyLiunian: {
        desc: "15 years old. Passed the high school entrance exam and finished the transition. Balanced in arts and sciences, fairly resilient. Looking for friends to grow together.",
        dream:
          "Dream: Aiming for NUDT, and doing my part to make LKM bigger and stronger√",
        quote:
          "— Pause, forget, and go with the wind; keep moving, keep observing, and stay at ease",
      },
      julyBadragon: {
        desc: "Follow LKM, thank you, meow",
      },
      julySanqi: {
        desc: "A vow made rashly invites misfortune",
        dream: "Dream: Keep a little cat",
      },
      julyEcho: {
        desc: "Analytic number theory enthusiast",
      },
      julyYuli: {
        desc: "Like the breeze of July, carrying a touch of warmth and gentleness. As the leader of the Community Affairs Group, I am committed to tending every little detail of our groups so that this becomes the most comfortable corner for everyone to chat in.",
        quote:
          "— Nothing about community affairs is trivial; with care, everything becomes a beautiful scene",
      },
      julyShiyi: {
        desc: "Bachelor's degree in a field related to economics, with wide-ranging interests.",
      },
      julyYanzimo: {
        desc: "Trained in Chinese language and literature",
        dream: "Dream: Become a philosopher and a mathematician",
        quote: "— Drift with the wind to faraway places.",
      },
      julySuibian: {
        desc: "A lazy person who wants to learn everything they find interesting.",
        dream: "Dream: Secret for now",
        quote:
          "— Move forward; even if you never reach the end, moving forward itself has meaning",
      },
      julyChi: {
        desc: "Graduated from a provincial key high school in Liaoning; targeting a 985 university in Northeast China for the 2026 exam",
        dream: "Dream: Become a master craftsman of the nation",
        quote: "— Do earth-shaking deeds; remain a nameless hero",
      },
      julyCaotiling: {
        desc: "A person who doesn't exist, but wishes to bless everyone.",
        dream:
          "Dream: Make everyone happy and reach the edge of knowledge's Sekai.",
        quote: "— We must know, we will know.",
      },
      julyYiqian: {
        desc: "I am Yiqian from the Press Office",
      },
      julySun: {
        desc: "Use the skills in my hands to serve more people in need. A kid from the Production Group.",
        dream: "Dream: Raise my education level and meet more people.",
        quote:
          "— No one holds up my lofty ambitions; I will tread through the snow to the mountain top myself.",
      },
      julyXingran: {
        desc: 'Member of the public-welfare science communication community and president of the Shuxing Science Club. Has worked in public-interest science communication for over three years. Led the Year of the Dragon Sci-Fi Contest and the first Earth-Moon Award sci-fi essay competition, co-organized the 2nd, 3rd, 4th, and 5th Xunyi Award science writing competitions, and co-created excellent science videos such as "Geological Hammer" with the UP Feicun Science Wall.',
        dream: "Dream: Spread science culture",
        quote: "— As Marx said, science and technology are productive forces.",
      },
      julyUpogg: {
        desc: "Student",
        quote: "— I take all knowledge as my domain",
      },
      julyKefenshulie: {
        desc: "An ordinary ICPCer",
      },
      julyA: {
        desc: "The main workhorse of website development",
        dream: "I do not want to be a workhorse in the future",
      },
      julyBcent: {
        desc: "A human being",
      },
      julyAleng: {
        desc: "An undergraduate math major at a Tier-2 school, math enthusiast whose favorite areas are analysis and number theory",
        dream:
          "Dream: Get recommended for graduate study and keep researching math",
        quote: "— All is number",
      },
      julyBifang: {
        desc: "A master's student in analysis and numerical computation",
      },
      julyYouzhu: {
        desc: "Possibly human (maybe not?)",
        quote: "— Being alive beats being dead",
      },
      julyLichlet: {
        desc: "A freshman math student",
      },
      julyHubingyang: {
        desc: "Male, 23 years old, bachelor's degree...",
        dream: "Dream: The dream is to become a mathematician",
        quote:
          "— Diligence is the path up the mountain of books; hard work is the boat across the boundless sea of learning.",
      },
      julyO: {
        desc: "PhD at the National Astronomical Observatories of the Chinese Academy of Sciences. Research: gravitational wave theory, black hole physics, general relativity",
        dream: "Dream: Do research I love",
        quote:
          "— Learn from the past, enjoy the present, look forward to the future",
      },
      julyQishui: {
        desc: "A freshman in fluid mechanics at LMU Munich",
        dream: "Dream: Contribute to China's fluid mechanics",
        quote: "— Effort always pays off",
      },
      julyXinghe: {
        desc: "A high school OIer and physics/chemistry/politics student, a noob (feel free to follow wang12345566 on Luogu), who stumbled into this heavenly family by accident after making some vicious middle school problems",
        dream:
          "Dream: Bring everyone more tricks and inspiration, while admiring even more masters",
        quote:
          "— Even those not standing in the light have their own sparkle — from hjh on Luogu",
      },
      julyTetro: {
        desc: "A graduate student in organic chemistry and former chemistry competition participant. My online handle is Tetrodotoxin, a structurally elegant organic small molecule and a classic in the history of total synthesis (though I actually do methodology). Privately, I am a not-too-heavy anime fan and a pseudo-intellectual art lover.",
      },
      julyDili: {
        desc: "You can call me Yang Xiangqing, a chemistry competition participant with a personal best of 7th in the district and 347th nationally in the middle school essay contest. I love studying chemistry and literature",
        dream: "Dream: Become an excellent teacher",
        quote: "— A true master always keeps an apprentice's heart",
      },
      julyWen: {
        desc: "A great player at going limp",
        dream: "Dream: Do nothing whenever I want to do nothing",
      },
      julySanchishui: {
        desc: "Chemistry, love love love it! (A fervent chemistry fanatic)",
      },
      julyJimi: {
        desc: "An 11th-grade international student in New Zealand, majoring in the sciences with English as a weak point. I am currently taking physics, biology, and math — basically at a high school level, but I will keep working to improve! I like writing my own things, and if there are any issues, thanks in advance for correcting me! I like summarizing my notes and hope they will be helpful to everyone! I also like sharing bits of my daily life or posting abstract stuff, sometimes with a fair amount of negativity... Thank you all!!!",
        dream:
          "Dream: Finish next year's coursework this year, secure a scholarship next year, and hopefully get into the University of Auckland?",
        quote: "— Attention, attention, a huge surge is coming",
      },
      julyYuye: {
        desc: "A 10th grader with 3 years of group management experience, exposed to traditional Chinese medicine since age 6. Comes from a TCM family",
        dream: "Dream: Have a stable job",
        quote:
          "— Chase the wind and the road without stopping; beyond the flat wilderness lie the spring hills.",
      },
      julyDaxiong: {
        desc: "Curious about a little bit of everything",
        dream: "Dream: Too many ideals",
      },
      julyJoshua: {
        desc: "A math lover who wants everyone to learn math with ease",
      },
      julyPlain: {
        desc: "Eat, drink, and the basics of life",
        dream: "Dream: Become verity",
        quote: "— Oh my god",
      },
    },
    subGroups: {
      affairsHigh: {
        label: "Senior High",
      },
      affairsHigh3: {
        label: "Senior High Group 3",
      },
      affairsJunior: {
        label: "Junior High",
      },
      affairsJunior2: {
        label: "Junior High Group 2",
      },
      affairsSocial: {
        label: "Social Sciences",
      },
      affairsLanguage: {
        label: "Language Society for International Science Exchange",
      },
      affairsChess: {
        label: "Interest - Chess & Cards Club",
      },
      affairsMusic: {
        label: "Interest - Tubie Music Club",
      },
      newsProduction: {
        label: "Production Group",
        desc: "Responsible for promotional production across platforms and events, such as UI design, poster making, visualization, and more. Certain design skills are required, making it suitable for those with the relevant abilities.",
      },
      newsPromotion: {
        label: "Promotion Group",
        desc: "Responsible for promotion and continuous operations across platforms, external outreach, and handling cooperation matters. Members need solid professional knowledge, public relations skills, and proficiency in two or more languages.",
      },
      newsScience: {
        label: "Science Communication Group",
        desc: "Responsible for science content collection and dissemination across platforms. Members need professional knowledge and know-how to create engaging science content, and stay in touch with the specialized committee. The development of project groups is also carried out by the Science Communication Group.",
      },
      profMath: {
        label: "Mathematics Group",
      },
      profPhysics: {
        label: "Physics Group",
      },
      profChemistry: {
        label: "Chemistry Group",
      },
      profBiology: {
        label: "Biology Group",
      },
      profGeneral: {
        label: "General",
      },
      profMedicine: {
        label: "Medicine Group - TCM",
      },
      projTextbooks: {
        label: "Textbook Project Group",
        desc: "Committed to writing high-quality science textbooks, integrating the body of knowledge, and providing learners with systematic learning resources.",
      },
      projScience: {
        label: "Science Communication Project Group",
        desc: "Responsible for science content collection and dissemination across platforms, turning professional knowledge into accessible science content and promoting the popularization of scientific knowledge.",
      },
    },
  },

  officialArticles: {
    relatedPosts: "Related Articles",
    empty: "No articles yet",
    loadFailed: "Failed to load: {error}",
  },

  shell: {
    community: "Community",
    official: "Official Site",
  },

  theme: {
    color: "Theme Color",
    light: "Light",
    dark: "Dark",
    system: "System",
    resetToDefault: "Reset to Default",
    lightDarkMode: "Light/Dark Mode",
    displaySettings: "Display Settings",
  },

  search: {
    placeholder: "Search",
    panel: "Search Panel",
    noResults: "No results found",
    placeholderExtended: "Search posts, files, users...",
    inputHint: "Type a keyword to search community content",
    noResultsPrefix: "No results found for",
    noResultsSuffix: "related content",
    posts: "Posts",
    files: "Files",
    users: "Users",
    tagFile: "File",
    tagUser: "User",
    postMeta: "Author: {author} · {likes} likes · {comments} comments",
    fileMeta: "Uploader: {author} · {size} MB · {downloads} downloads",
    mockQuantumTitle: "Quantum Mechanics Intro: Wave Function Collapse",
    mockMathTitle: "Mathematical Modeling Competition Experience",
    mockPythonTitle: "Python Data Analysis Tutorial",
    mockAstroFileTitle: "Astrophysics Dataset (2026).zip",
    mockLinearFileTitle: "Linear Algebra Exercises.pdf",
    userQiyueOName: "July O",
    userQiyueHuaName: "July Hua",
    userQiyueMoranName: "July Moran",
    userQiyueODesc:
      "PhD from the National Astronomical Observatories of China · Gravitational waves & black hole physics",
    userQiyueHuaDesc: "A PhD with ideals · Science education advocate",
    userQiyueMoranDesc:
      "Physics from a non-985/211 university — three thousand days of bitter persistence",
  },

  user: {
    login: "Log in",
    register: "Sign up",
    logout: "Log out",
    profile: "My Profile",
    contribution: "Contribution System",
    settings: "Settings",
    admin: "Administrator",
    localAccount: "Local Account",
    normalUser: "Normal User",
    profilePage: "My Profile",
  },

  projectHub: {
    apply: "📢 Comment / Apply",
    applyAria: "Comment or apply to join a project",
    create: "➕ Start a Project",
    createAria: "Start a new project",
    createTitle: "➕ Start a New Project",
    tabRecruiting: "Recruiting",
    tabShowcase: "Showcase",
    pinned: "Pinned",
    incubated: "July Incubated",
    initiatedBy: "Initiated by {name}",
    recruiting: "Recruiting",
    showcase: "Showcase",
    progressValue: "Progress {progress}%",
    roleMissing: "Missing {role}",
    noProjects: "No projects yet",
    closeDialogAria: "Close dialog",
    nickname: "Nickname",
    nicknamePlaceholder: "Enter your nickname (2-20 characters)",
    currentProgress: "Current project progress",
    selectPlaceholder: "Select...",
    progressIdea: "Idea only",
    progressPlanning: "Planning",
    progressPrototype: "Prototype ready",
    progressDeveloping: "Developing",
    progressTesting: "Testing",
    progressLaunched: "Launched",
    joinGroup: "Join a project group",
    groupQuantum: "Quantum",
    groupKnowledgeGraph: "Knowledge Graph",
    groupAstronomy: "Astronomy",
    groupScienceVideo: "Science Videos",
    applyIncubator: "Apply to enter a July Incubated project",
    contact: "Contact info",
    contactPlaceholder: "Enter phone number or email",
    contactPlaceholder2: "Phone number or email",
    submitting: "Submitting...",
    submitApply: "Submit Application",
    projectName: "Project name",
    projectNamePlaceholder: "Enter the project name",
    projectDescription: "Project description",
    projectDescriptionPlaceholder:
      "Briefly describe the project background and goals",
    recruitingRoles: "Roles to recruit",
    rolesPlaceholder: "e.g. Frontend developer, UI designer (comma separated)",
    errNicknameRequired: "Please enter a nickname",
    errNicknameMinLength: "Nickname must be at least 2 characters",
    errNicknameInvalid: "Nickname contains invalid characters",
    errProgressRequired: "Please select a progress stage",
    errGroupRequired: "Please select a project group",
    errContactRequired: "Please enter contact info",
    errContactInvalid: "Please enter a valid phone number/email",
    errNameRequired: "Please enter a project name",
    errNameTooLong: "Name is too long",
    errNameInvalid: "Contains invalid characters",
    errDescRequired: "Please enter a description",
    errDescTooLong: "Description is too long",
    applySuccess: "Application submitted!",
    applyFailed: "Submission failed",
    createSuccess: "Project created!",
    createFailed: "Creation failed",
    err400: "The request parameters are invalid, please check your input.",
    err401: "Your session has expired, please log in again.",
    err403: "You do not have permission to perform this action.",
    err500: "Server error, please try again later.",
    errGeneric: "Request failed, please try again later.",
  },

  primitives: {
    empty: "Nothing here yet",
    loading: "Loading...",
    noImage: "No image",
    tableOfContents: "Table of Contents",
    formStaticWarning:
      "This form is a static demo and cannot be submitted online. Please contact us through other channels.",
  },

  layout: {
    navigation: "Navigation",
  },

  languageSwitcher: {
    zh: "Chinese",
    en: "English",
  },

  competition: {
    allDifficulties: "All difficulties",
    difficultyEasy: "★ Easy",
    difficultyMedium: "★★ Medium",
    difficultyHard: "★★★ Hard",
    singleChoice: "Single choice",
    trueFalse: "True/False",
    categoryAll: "All",
    categoryPhysics: "Physics",
    categoryMath: "Mathematics",
    categoryChemistry: "Chemistry",
    categoryBiology: "Biology",
    categoryCs: "Computer Science",
  },

  auth: {
    modal: {
      ariaLabel: "Authentication dialog",
    },
    segmented: {
      ariaLabel: "Select login method",
    },
    field: {
      showPassword: "Show password",
      hidePassword: "Hide password",
      show: "Show",
      hide: "Hide",
    },
    login: {
      title: "Log in",
      success: "Logged in",
      subtitle: "Log in to LKM to access community resources and docs",
      twoFactor: "Two-factor authentication",
      welcomeBack: "Welcome back, {name}",
      user: "User",
      accountLabel: "Username / Email / Phone",
      accountPlaceholder: "Enter username, email or phone number",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      forgotPassword: "Forgot password?",
      emailOrPhone: "Email / Phone",
      emailOrPhonePlaceholder: "Enter the account to receive the code",
      getCode: "Get code",
      resendCode: "Resend in {count}s",
      otherMethods: "Other ways to log in",
      githubLogin: "Log in with GitHub",
      magicLink: "Magic Link login",
      passkey: "Passkey",
      magicSent: "Magic Link sent, please check your inbox",
      magicNoEmail: "Haven't received the email? Resend or use another method.",
      continueOnDevice: "Continue on this device",
      backToLogin: "Back to log in",
      redirectingGithub: "Redirecting to GitHub...",
      redirecting: "Redirecting",
      passkeyVerifying: "Verifying Passkey...",
      waitingDevice: "Waiting for device verification",
      noAccount: "Don't have an account?",
      signUpNow: "Sign up now",
      passwordLogin: "Password",
      codeLogin: "Verification code",
      sendTo: "Sent to:",
      resendCodeBtn: "Resend code",
      getCodeBtn: "Get code",
      codeSentHint: "Code sent (demo code: 000000)",
      codeLabel: "Verification code",
      codePlaceholder6: "Enter the 6-digit code",
      codeRequired: "Please enter the verification code",
      tooManyAttempts: "Too many failed attempts, please request a new code",
      passwordRequired: "Please enter your password",
      passwordTooShort: "Password must be at least 6 characters",
      githubUnavailable:
        "This login method is being connected to the backend and is temporarily unavailable",
      githubComingSoon: "Coming soon",
      githubCancelled: "Authorization cancelled, please try again",
      passkeyUnavailable:
        "This login method is being connected to the backend and is temporarily unavailable",
      passkeyTitle: "Log in with a passkey",
      passkeyHint: "Authenticate with your device fingerprint, face or PIN",
      magicSentTitle: "Magic link sent",
      magicSentSimulation: "A login link has been sent to",
      simulateClick: "Simulate clicking the email link",
      simulateExpired: "Simulate expired link",
      simulateUsed: "Simulate used link",
      linkExpired: "The link has expired, please request a new one",
      linkUsed:
        "The link is no longer valid (already used), please request a new one",
      backToResend: "Back to resend",
      magicSendTo: "We will send an email with a login link to",
      sendMagicLink: "Send magic link",
    },
    twoFactor: {
      title: "Two-factor authentication",
      recoveryCode: "Backup recovery code",
      recoveryCodePlaceholder: "Format: AAAA-BBBB-CCCC",
      verifyRecoveryCode: "Verify recovery code",
      backToTotp: "Back to TOTP verification",
      totpHint: "Enter the 6-digit code from Google Authenticator",
      code: "Verification code",
      enter6Digit: "Enter the 6-digit code",
      verify: "Verify",
      useRecoveryCode: "Can't verify / lost device? Use a backup recovery code",
      verifyPassed: "Verification passed, logged in",
      enter6DigitError: "Enter a 6-digit code",
      enterRecoveryCode: "Enter your backup recovery code",
      recoverySuccess:
        "Recovery code verified, logged in. Please re-bind 2FA in settings.",
      testModeTempToken:
        "Test mode is missing a temp_token, recovery code verification is unavailable.",
      recoveryTitle: "2FA Recovery",
      email: "Email",
      verifyIdentity: "Verify your identity via email",
      enterBoundEmail: "Enter your bound email",
      simulatedCode: "Simulated code: 000000",
      enterSimulatedCode: "Enter code (simulation: 000000)",
      enterRecoveryTitle: "Enter your backup recovery code",
      recoveryCodeName: "Recovery code",
      contactAdmin: "Contact another admin for help (simulation)",
      recoverySuccess2: "Recovery successful",
      pleaseReSetup2fa: "Please set up 2FA again",
      done: "Done",
      enterEmailError: "Please enter your email",
      wrongCodeError: "Wrong code (simulated code: 000000)",
      invalidRecoveryCode: "Invalid recovery code",
      digitLabel: "Digit {index}",
    },
    oauth: {
      completing: "Completing third-party login...",
      failed: "Third-party login failed, please try again",
    },

    register: {
      title: "Sign up",
      subtitle: "Create a LKM account",
      success: "Account created",
      backHome: "Back to home",
      normalAccount: "Normal Account",
      localAccount: "Local Account",
      or: "Or",
      githubRegister: "Sign up with GitHub",
      haveAccount: "Already have an account?",
      loginNow: "Log in now",
      githubNotSupported: "GitHub OAuth sign-up is not available yet",
    },
  },

  recovery: {
    title: "Password Recovery",
    subtitle: "Reset your login password",
    accountHint:
      "Enter the email or phone number you registered with to receive a verification code",
    useEmail: "Use email",
    usePhone: "Use phone number",
    email: "Email",
    phone: "Phone number",
    emailPlaceholder: "Enter your email",
    phonePlaceholder: "Enter your phone number",
    sendCode: "Send verification code",
    code: "Verification code",
    codePlaceholder: "Enter verification code",
    verifyCode: "Verify code",
    twoFactorHint:
      "This account has two-step verification enabled. Enter the code.",
    totp: "One-time code",
    totpPlaceholder: "6-digit code",
    restart: "Recovery complete, start over",
    newPassword: "New password",
    newPasswordPlaceholder: "Enter a new password (at least 6 characters)",
    confirmPassword: "Confirm new password",
    confirmPasswordPlaceholder: "Re-enter new password",
    resetPassword: "Reset password",
    done: "Password reset",
    loginWithNewPassword: "Log in with your new password",
    goLogin: "Go to log in",
  },

  register: {
    local: {
      onlyUsername: "Username + password only, no email/phone required",
      username: "Username",
      usernamePlaceholder: "Enter a username (at least 3 characters)",
      password: "Password",
      passwordPlaceholder: "Enter a password (at least 6 characters)",
      confirm: "Confirm password",
      confirmPlaceholder: "Re-enter password (at least 6 characters)",
      submit: "Create local account",
    },
    normal: {
      onlyEmail: "Username + email only, verify to register",
      onlyPhone: "Username + phone number only, verify to register",
      username: "Username",
      usernamePlaceholder: "Enter a username (at least 3 characters)",
      password: "Password",
      passwordPlaceholder: "Enter a password (at least 6 characters)",
      confirm: "Confirm password",
      confirmPlaceholder: "Re-enter password (at least 6 characters)",
      useEmail: "Use email",
      usePhone: "Use phone number",
      email: "Email",
      phone: "Phone number",
      emailPlaceholder: "Enter email address",
      phonePlaceholder: "Enter phone number",
      sendCode: "Send verification code",
      codeSentEmail: "Verification code sent to your email",
      codeSentPhone: "Verification code sent to your phone",
      code: "Verification code",
      codePlaceholder: "Enter verification code",
      verifyAndFinish: "Verify and finish sign-up",
      backToEdit: "Back to edit",
    },
  },

  onboarding: {
    stepsAria: "Onboarding steps",
    prev: "Previous",
    next: "Next",
    skipAll: "Skip all",
    finish: "Finish onboarding",
    optionalNote: "This step is optional",
    requiredNote: "This step is required",
    identityTitle: "Identity tags",
    followTitle: "Follow recommendations",
    quizTitle: "Quiz upgrade",
    tasksTitle: "Newbie tasks",
    followAll: "Follow all",
    submit: "Submit",
    tags: {
      title: "Select your identity tags",
      subtitle: "Help us recommend more relevant content (optional)",
      grade: "Grade",
      major: "Major / Field (multi-select)",
      interests: "Interests (multi-select)",
      juniorHigh: "Junior high",
      seniorHigh: "Senior high",
      university: "University",
      graduate: "Graduate",
      working: "Working",
      math: "Mathematics",
      physics: "Physics",
      chemistry: "Chemistry",
      biology: "Life sciences",
      astronomy: "Astronomy",
      earthScience: "Earth science",
      cs: "Computer science",
      ee: "Electronics & EE",
      engineering: "Engineering",
      medicine: "Medicine",
      socialScience: "Social sciences",
      literature: "Literature",
      research: "Research",
      programming: "Programming",
      reading: "Reading",
      writing: "Writing",
      experiment: "Experiments",
      teaching: "Teaching",
      debate: "Debate",
      competition: "Competitions",
      astronomyHobby: "Astronomy",
      model: "Model making",
      game: "Gaming",
      music: "Music",
      sciFi: "Sci-fi",
      cooking: "Cooking",
      chess: "Chess",
    },
    follow: {
      title: "Follow what interests you",
      hint: "Select at least {min} boards or authors (selected {selected}/{min})",
      categoriesTab: "Board recommendations",
      authorsTab: "Author recommendations",
      members: "members",
      followers: "followers",
    },
    tasks: {
      completeProfile: "Complete your profile",
      rewardHint:
        'Complete the info to earn {points} points + the "Newcomer" title',
      displayName: "Display name",
      displayNamePlaceholder: "Your nickname",
      motto: "Motto",
      mottoPlaceholder: "Describe yourself in one sentence",
      intro: "Bio",
      introPlaceholder: "Briefly introduce yourself...",
      rewardTitle: "Completion reward",
      rewardDetail: '+100 points · Unlock the "Newcomer" title',
    },
    quiz: {
      title: "Professional knowledge quiz",
      subtitle:
        "Pass the quiz to unlock column features and professional status (optional, you can do it later in settings)",
      chooseField: "Choose your field of expertise",
      start: "Start quiz ({count} questions)",
      progress: "Question {current} / {total}",
      prev: "Previous",
      next: "Next",
      passed: "Congratulations, you passed!",
      failed: "Not passed",
      result: "Correct {correct} / {total} (rate {rate}%)",
      unlocked: "Columns and professional status unlocked!",
      retryHint: "Reach 60% to pass. You can retry or try again later.",
      retry: "Retry quiz",
    },
    quizData: {
      p1: {
        stem: "Approximately what is the speed of light in a vacuum?",
        options: ["3×10⁶ m/s", "3×10⁷ m/s", "3×10⁸ m/s", "3×10⁹ m/s"],
      },
      p2: {
        stem: "What is the formula for Newton's second law?",
        options: ["F = mv", "F = ma", "F = m/v", "F = m²a"],
      },
      p3: {
        stem: "Which of the following is an elementary particle?",
        options: ["Proton", "Neutron", "Electron", "Atom"],
      },
      p4: {
        stem: "Who formulated the law of conservation of energy?",
        options: ["Newton", "Einstein", "Joule", "von Helmholtz"],
      },
      p5: {
        stem: "Which of the following phenomena is wave interference?",
        options: ["Rainbow", "Colors on soap bubbles", "Shadow", "Lightning"],
      },
      m1: {
        stem: "Euler's formula e^(iπ) + 1 = ?",
        options: ["0", "1", "-1", "i"],
      },
      m2: {
        stem: "Which of the following is a prime number?",
        options: ["51", "57", "91", "97"],
      },
      m3: {
        stem: "sin²x + cos²x = ?",
        options: ["0", "1", "2", "x"],
      },
      m4: {
        stem: "What is the sum of the series 1 + 1/2 + 1/4 + 1/8 + ...?",
        options: ["1", "2", "∞", "e"],
      },
      m5: {
        stem: "Who proved Fermat's Last Theorem?",
        options: ["Euler", "Gauss", "Andrew Wiles", "Hilbert"],
      },
      c1: {
        stem: "What is the chemical formula of water?",
        options: ["H₂O", "CO₂", "NaCl", "O₂"],
      },
      c2: {
        stem: "Which of the following is a noble gas?",
        options: ["Oxygen", "Nitrogen", "Argon", "Hydrogen"],
      },
      c3: {
        stem: "pH = 7 means the solution is?",
        options: ["Acidic", "Basic", "Neutral", "Uncertain"],
      },
      c4: {
        stem: "What is the role of a catalyst in a chemical reaction?",
        options: [
          "Increase yield",
          "Lower activation energy",
          "Change the equilibrium constant",
          "Consume reactants",
        ],
      },
      c5: {
        stem: "Which element has atomic number 6?",
        options: ["Nitrogen", "Carbon", "Oxygen", "Boron"],
      },
      b1: {
        stem: "What is the full name of DNA?",
        options: [
          "Deoxy nucleic acid",
          "Deoxyribonucleic acid",
          "Ribonucleic acid",
          "Deoxynucleotide",
        ],
      },
      b2: {
        stem: "During which stage of cell division does the chromosome number double?",
        options: ["Interphase", "Prophase", "Metaphase", "Anaphase"],
      },
      b3: {
        stem: "Which of the following is a function of mitochondria?",
        options: [
          "Photosynthesis",
          "Protein synthesis",
          "Aerobic respiration",
          "Cell movement",
        ],
      },
      b4: {
        stem: "In Mendelian inheritance, what is the approximate F₂ phenotype ratio?",
        options: ["1:1", "3:1", "9:3:3:1", "1:2:1"],
      },
      b5: {
        stem: "Which of the following is a feature of RNA that differs from DNA?",
        options: [
          "Double-stranded structure",
          "Contains deoxyribose",
          "Contains uracil",
          "Contains thymine",
        ],
      },
      cs1: {
        stem: "What is the time complexity of binary search?",
        options: ["O(n)", "O(n²)", "O(log n)", "O(n log n)"],
      },
      cs2: {
        stem: "Which layer of the OSI model does TCP belong to?",
        options: [
          "Application layer",
          "Network layer",
          "Transport layer",
          "Data link layer",
        ],
      },
      cs3: {
        stem: "Which of the following sorting algorithms is stable?",
        options: ["Quicksort", "Heapsort", "Mergesort", "Selection sort"],
      },
      cs4: {
        stem: "In binary, 1010 + 0110 = ?",
        options: ["10000", "11000", "11110", "10110"],
      },
      cs5: {
        stem: "In RESTful APIs, which HTTP method is used to update a resource?",
        options: ["GET", "POST", "PUT", "DELETE"],
      },
    },
    followData: {
      basicScience: {
        name: "Basic Sciences",
        description:
          "Discussion area for basic sciences such as mathematics, physics, chemistry, biology and astronomy",
      },
      appliedScience: {
        name: "Applied Sciences",
        description:
          "Applied fields such as computer science, electronics & electrical engineering, engineering and medicine",
      },
      language: {
        name: "Language Learning",
        description:
          "Exchange and learning of multiple languages such as English, Russian, German and Japanese",
      },
      hobbyChess: {
        name: "Chess & Cards Club",
        description:
          "Exchange on Chinese chess, Go, Gomoku, bridge and other board/card games",
      },
      hobbyGame: {
        name: "Gaming Club",
        description: "A gathering place for console, PC and mobile gamers",
      },
      hobbySciFi: {
        name: "Sci-Fi Literature Club",
        description:
          "Sci-fi writing, classic appreciation and visions of the future",
      },
      hobbyMusic: {
        name: "Music Club",
        description:
          "Music theory discussions, instrument exchange and party planning",
      },
      hobbyCooking: {
        name: "Culinary Club",
        description: "Cooking exchange, food sharing and culinary lessons",
      },
      math: {
        name: "Mathematics",
        description:
          "A place for math enthusiasts and professionals to exchange ideas",
      },
      physics: {
        name: "Physics & Astronomy",
        description:
          "Exploring the mysteries of the universe and discussing the frontiers of physics",
      },
      authorJulyO: {
        name: "July O",
        description:
          "PhD from the National Astronomical Observatories of China, specializing in gravitational waves and black hole physics",
      },
      authorJulyHua: {
        name: "July Hua",
        description:
          "A PhD with ideals — dreaming that every child can access science",
      },
      authorJulyMoran: {
        name: "July Moran",
        description:
          "Physics from a non-985/211 university — three thousand days of bitter persistence, gold refined from deep snow",
      },
      authorJulyYuli: {
        name: "July Yuli",
        description:
          "Head of the Community Affairs Group — no task is trivial, every effort paints a landscape",
      },
      authorJulyYouzhi: {
        name: "July Youzhi",
        description:
          "Former member of the Event Planning Group — pause and forget with the wind",
      },
    },
  },

  settings: {
    title: "Account Settings",
    subtitle: "Manage your profile and security settings",
    profileTitle: "Profile",
    securityTitle: "Login & Security",
    accountTitle: "Account",
    nickname: "Nickname",
    nicknamePlaceholder: "Set your nickname",
    contactTitle: "Contact Information",
    add: "Add",
    contactHint:
      "Public contact info such as QQ / WeChat / GitHub will be shown on your profile sidebar.",
    linkNamePlaceholder: "Name (e.g. QQ / GitHub)",
    iconPlaceholder: "Icon name (optional)",
    urlPlaceholder: "Link / account (optional)",
    saveContacts: "Save contact info",
    userId: "User ID",
    username: "Username",
    level: "Level",
    role: "Role",
    email: "Email",
    phone: "Phone number",
    notBound: "Not bound",
    localUpgradeHint:
      "You are using a local account. Binding an email or phone number will upgrade it to a normal account and unlock all features.",
    recovery: "Password recovery",
    logoutTitle: "Log out",
    logoutMessage: "Are you sure you want to log out of the current account?",
    securityUpdated: "Security settings updated",
    profileUpdated: "Profile updated",
    contactsUpdated: "Contact info updated",
    saveFailed: "Save failed, please try again",
    loginRequired: "Please log in first",
    loginRequiredHint: "You need to be logged in to access this page",
    goLogin: "Go to log in",
    "2fa": {
      title: "Two-factor authentication (2FA)",
      totp: "TOTP codes",
      on: "Enabled",
      off: "Disabled",
      enable: "Enable",
      disable: "Disable",
      scanHint:
        "Scan the QR code with an authenticator app (e.g. Google Authenticator / 1Password), or enter the secret key below.",
      qrAlt: "TOTP QR code",
      codePlaceholder: "Enter the 6-digit code shown after scanning",
      confirmEnable: "Confirm enable",
      recoveryCodes: "Recovery codes",
      hideRecoveryCodes: "Save and hide",
      recoveryHint:
        "Keep these codes safe; use one to log in and re-set up 2FA if you lose your authenticator.",
      disableHint:
        "Enter the 6-digit code from your current authenticator to confirm disabling",
      confirmDisable: "Confirm disable",
      enter6Digit: "Enter the 6-digit code",
    },
    bind: {
      title: "Login methods",
      email: "Email",
      phone: "Phone number",
      bound: "Bound",
      notBound: "Not bound",
      bind: "Bind",
      unbind: "Unbind",
      emailPlaceholder: "Enter email address",
      phonePlaceholder: "Enter phone number",
      codePlaceholder: "Enter verification code",
      sendCode: "Send code",
      confirmBind: "Confirm bind",
      enterTOTP: "Two-step verification is enabled, enter the one-time code",
      confirmUnbind: "Confirm unbind",
      enterEmail: "Enter email address",
      enterPhone: "Enter phone number",
      enterCode: "Enter verification code",
      githubFail: "Failed to start GitHub authorization",
      unbindFail: "Unbind failed, please try again",
    },
    passkey: {
      title: "Passkeys",
      namePlaceholder: "Name the new key (e.g. My phone)",
      empty: "No passkeys yet",
      deleteTitle: "Delete passkey",
      deleteMessage:
        "Are you sure you want to delete this passkey? This action cannot be undone.",
      deleteStepUpHint:
        "Deleting this passkey requires two-factor verification. Enter the 6-digit code from your authenticator app (no repeat within 1 hour).",
      createFail: "Failed to create passkey",
    },
  },

  forumData: {
    categories: {
      basicScience: {
        name: "Basic Sciences",
        description:
          "Discussion area for foundational sciences such as mathematics, physics, chemistry, biology and astronomy. It is the root of all things — applied disciplines sprout from here and extend into many fields.",
      },
      appliedScience: {
        name: "Applied Sciences",
        description:
          "Applied fields such as computer science, electronics & electrical engineering, engineering and medicine — the bridge connecting theory to practice.",
      },
      language: {
        name: "Language Learning",
        description:
          "Language study area needed for reading papers and international exchange, finely divided by language.",
      },
      hobby: {
        name: "Interest Clubs",
        description:
          "Clubs formed from members' various interests; every winter and summer break features exciting activities.",
      },
      group: {
        name: "Community Groups",
        description:
          "Divided by member background and profession, giving members of different backgrounds a better space to discuss.",
      },
      schoolClub: {
        name: "School Clubs",
        description:
          "Boards for partner school clubs of LKM; apply for collaboration to open your dedicated area.",
      },
      friendshipOrganization: {
        name: "Partner Organizations",
        description:
          "Boards for partner organizations of LKM; apply for collaboration to open your dedicated area.",
      },
      friendshipEnterprise: {
        name: "Partner Enterprises",
        description:
          "Boards for partner tech companies of LKM; apply for collaboration to open your dedicated area.",
      },
      math: {
        name: "Mathematics",
        description:
          "A gathering place for those interested in or professionally involved in mathematics, where math lovers can discuss mathematical knowledge and frontier content.",
      },
      physics: {
        name: "Physics",
        description:
          "Debates on fundamental theory and its historical evolution, quantum mechanics and frontier physics, condensed matter and materials science.",
      },
      cosmosAstronomy: {
        name: "Cosmology & Astronomy",
        description:
          "Astronomy is a natural science that studies celestial bodies in space and the structure and development of the universe.",
      },
      chemistry: {
        name: "Chemistry",
        description:
          "Chemistry, applied chemistry, chemical biology, molecular science and engineering. Few in number but high level, with requests basically always fulfilled.",
      },
      biology: {
        name: "Life Sciences",
        description:
          "Multiple branches including biology, medicine, agriculture and environmental science; members are focused, and medicine will get its own board later.",
      },
      earthScience: {
        name: "Earth Sciences",
        description:
          "Comprehensive disciplines such as geology, geophysics, geography, atmospheric science and marine science.",
      },
      psychology: {
        name: "Psychology",
        description:
          "Exchange and discussion across all branches of psychology.",
      },
      socialScience: {
        name: "Social Sciences",
        description:
          "Philosophy, politics, history, economics and law — encouraging learning and exposure, combining theory with practice.",
      },
      literature: {
        name: "Literature",
        description:
          "Literary discussion, appreciation of classics and literary creation. All literature lovers are welcome.",
      },
      cs: {
        name: "Computer Science & Technology",
        description:
          "ACM, computer science, internet, software development, algorithm research, large models and network security.",
      },
      ee: {
        name: "Electronics & Electrical Engineering",
        description:
          "IEEE, electrical engineering, automation, communication engineering, electronic science & technology and optoelectronics.",
      },
      icSemiconductor: {
        name: "Integrated Circuits & Semiconductors",
        description:
          "Chip design, wafer fabrication, packaging and testing — a hardcore circle with extremely high technical barriers.",
      },
      engineering: {
        name: "Engineering",
        description:
          "Civil, mechanical, transportation, safety science and engineering, etc. More engineering sub-groups will come later.",
      },
      agriFood: {
        name: "Agriculture & Food Science",
        description:
          "Agriculture focuses on crop production and genetics & breeding; food science focuses on food processing and safety control.",
      },
      envEnergy: {
        name: "Environment & Energy Sciences",
        description:
          "Environmental science, energy engineering, resource recycling and emerging interdisciplinary fields.",
      },
      lightIndustry: {
        name: "Light Industry",
        description:
          "Textiles, light industry engineering, packaging engineering, flavors & fragrances and cosmetics technology.",
      },
      geoEngineering: {
        name: "Geoscience Engineering",
        description:
          "Surveying, geology, mining, safety science and engineering.",
      },
      medicine: {
        name: "Medicine HQ",
        description:
          "Traditional Chinese medicine, clinical medicine, pharmacy, nursing, stomatology, imaging, anesthesiology and forensic medicine.",
      },
      clinicalMedicine: {
        name: "School of Clinical Medicine",
        description:
          "Clinical medicine, anesthesiology, medical imaging, ophthalmology & optometry, psychiatry, radiation medicine and pediatrics.",
      },
      tcm: {
        name: "School of Traditional Chinese Medicine",
        description:
          "The essence of traditional medicine — TCM basic theory, TCM internal medicine, acupuncture & tuina and ethnic medicine.",
      },
      langEn: {
        name: "English",
        description: "The common language of international academic exchange.",
      },
      langRu: {
        name: "Russian",
        description: "Reading Russian scientific literature.",
      },
      langDe: {
        name: "German",
        description: "German engineering and technology literature.",
      },
      langZh: {
        name: "Chinese",
        description: "Chinese linguistics and Chinese culture.",
      },
      langJa: {
        name: "Japanese",
        description: "Japanese scientific literature and cultural exchange.",
      },
      langKo: {
        name: "Korean",
        description: "Korean science, technology and cultural exchange.",
      },
      hobbyChess: {
        name: "Chess & Cards Club",
        description:
          "Chinese chess, Go, Gomoku, checkers, Flying Chess and other traditional and competitive games, plus poker, TCG and tabletop cards.",
      },
      hobbyGame: {
        name: "Gaming Club",
        description:
          "Console (PS/Xbox/Switch), PC (Steam/Epic) and mobile games — game topics and squad forming.",
      },
      hobbySciFi: {
        name: "Sci-Fi Literature Club",
        description:
          "Imagining the sci-fi world and literary creation — this is part of the plan!",
      },
      hobbyMusicGame: {
        name: "Anime Rhythm Game Club",
        description: "Discuss rhythm games, share charts and techniques.",
      },
      hobbyCooking: {
        name: "Culinary Club",
        description:
          "Discuss cooking and the chemistry behind it, share culinary skills and showcase dishes. Teaching livestreams may come later.",
      },
      hobbyMusic: {
        name: "Tubie Music Club",
        description:
          "Music theory discussions, instrument learning and exchange, music creation and appreciation, and various music topics.",
      },
      groupInternational: {
        name: "International",
        description:
          "Exchange area for international students, overseas students and foreign friends — used for domestic and international tech exchange.",
      },
      groupJuniorHigh: {
        name: "Junior High Students",
        description:
          "Discussion of arts and sciences learning at junior high level, preparing for the high school entrance exam.",
      },
      groupSeniorHighSchool: {
        name: "Senior High Students",
        description:
          "Discussion of arts and sciences learning at senior high level, preparing for the college entrance exam.",
      },
      groupTeacher: {
        name: "Educators",
        description:
          "A dedicated exchange area for educators, sharing teaching experience and resources.",
      },
      groupScientist: {
        name: "Science Popularization Workers",
        description:
          "A dedicated exchange area for science popularization workers, sharing scientific knowledge and resources.",
      },
    },
  },

  columnData: {
    columns: {
      col1: {
        authorName: "July O",
        authorTitle: "PhD, National Astronomical Observatories of China",
        authorBio:
          "Focusing on gravitational waves and black hole physics, dedicated to astrophysics popularization",
        title: "Cosmic Exploration Notes",
        description:
          "Recording the frontiers of astrophysics research and sharing the marvelous journey of cosmic exploration. From gravitational waves to black holes, from dark matter to the large-scale structure of the universe.",
      },
      col2: {
        authorName: "July Hua",
        authorTitle: "PhD in Science Education",
        authorBio:
          "A PhD with ideals — dreaming that every child can access science",
        title: "The Educator's Laboratory",
        description:
          "Theory and practice of science education — deep reflections on curriculum design, teaching methods and science writing.",
      },
      col3: {
        authorName: "Prof. Li",
        authorTitle: "Professor of Physics, Fudan University",
        authorBio:
          "Condensed matter physics research, academic writing mentoring",
        title: "The Way of Academic Writing",
        description:
          "Sharing hardcore content on paper-writing skills, academic English expression and research methodology.",
      },
      col4: {
        authorName: "Old Wang the Coder",
        authorTitle: "Senior Algorithm Engineer",
        authorBio:
          "10 years of algorithm competition and engineering experience",
        title: "The Beauty of Algorithms",
        description:
          "Explaining algorithms and data structures in an accessible way — from LeetCode to ACM, from engineering practice to theoretical derivation.",
      },
    },
    articles: {
      art1: {
        title:
          'Gravitational-Wave Astronomy: Listening to the "Voice" of the Universe',
        excerpt:
          "Since the first detection of GW150914 in 2015, gravitational-wave astronomy has become a brand-new window into the universe.",
        tags: {
          a: "Gravitational Waves",
          b: "Astrophysics",
          c: "LIGO",
        },
      },
      art2: {
        title:
          "The Black Hole Information Paradox: One of Physics' Greatest Mysteries",
        excerpt:
          "The discovery of Hawking radiation raised a profound question: where does the information that falls into a black hole go?",
        tags: {
          a: "Black Holes",
          b: "Hawking Radiation",
          c: "Quantum Gravity",
        },
      },
      art3: {
        title: "How to Design a Captivating Science Course",
        excerpt:
          "Exploring the core principles of science course design based on cognitive science and teaching practice.",
        tags: {
          a: "Science Education",
          b: "Course Design",
          c: "Popularization",
        },
      },
      art4: {
        title: "The Golden Rules of Writing a Paper Abstract",
        excerpt:
          'The abstract is the "advertisement" of a paper — a good abstract can decide a paper\'s citation rate and influence.',
        tags: {
          a: "Academic Writing",
          b: "Papers",
          c: "Abstract",
        },
      },
      art5: {
        title:
          "Dynamic Programming: A Thinking Framework from Beginner to Advanced",
        excerpt:
          "Dynamic programming is not an algorithm, but a way of thinking about problems.",
        tags: {
          a: "Algorithms",
          b: "Dynamic Programming",
          c: "Python",
        },
      },
    },
  },

  fileLibraryData: {
    categories: {
      basicScience: "Basic Sciences",
      appliedScience: "Applied Sciences",
      language: "Language Learning",
      math: "Mathematics",
      physics: "Physics",
      chemistry: "Chemistry",
      biology: "Life Sciences",
      earthScience: "Earth Sciences",
      cosmosAstronomy: "Cosmology & Astronomy",
      cs: "Computer Science & Technology",
      icSemiconductor: "Integrated Circuits & Semiconductors",
      langEn: "English",
      mathLinearAlgebra: "Linear Algebra",
      mathModeling: "Mathematical Modeling",
      physicsQuantum: "Quantum Mechanics",
      physicsAstrophysics: "Astrophysics",
      chemistryOrganic: "Organic Chemistry",
      csPython: "Python Data Analysis",
      icDesign: "Chip Design",
      langEnWriting: "Academic Writing",
    },
    uploaders: {
      qiyueO: "July O",
      qiyueMoran: "July Moran",
      qiyueHua: "July Hua",
      chemistryFan: "Chemistry Enthusiast",
      chipEngineer: "Chip Engineer",
      overseasStudentXiaoMing: "Student Xiaoming",
    },
    files: {
      file1: {
        description:
          "Curated public astrophysics datasets including SDSS, Gaia DR3 and LIGO event data, suitable for learning and research.",
        tags: {
          a: "Astrophysics",
          b: "Datasets",
          c: "Astronomy",
        },
      },
      file2: {
        description:
          "Quantum mechanics course notes from the Chinese Academy of Sciences, covering everything from wave functions to perturbation theory.",
        tags: {
          a: "Quantum Mechanics",
          b: "Lecture Notes",
          c: "Physics",
        },
      },
      file3: {
        description:
          "Classic linear algebra exercise sets with detailed solutions and problem-solving analysis, suitable for final review and graduate school preparation.",
        tags: {
          a: "Linear Algebra",
          b: "Exercises",
          c: "Mathematics",
        },
      },
      file4: {
        description:
          "Illustrated mechanisms of common organic chemistry reactions, including nucleophilic substitution, elimination and addition reactions.",
        tags: {
          a: "Organic Chemistry",
          b: "Reaction Mechanisms",
          c: "Illustrated",
        },
      },
      file5: {
        description:
          "Hands-on code and data files that accompany the Pandas/NumPy/Matplotlib tutorials.",
        tags: {
          a: "Python",
          b: "Data Analysis",
          c: "Code",
        },
      },
      file6: {
        description:
          "A collection of excellent papers from the past three years of the National College Mathematical Contest in Modeling, with expert commentary.",
        tags: {
          a: "Mathematical Modeling",
          b: "Competition",
          c: "Paper Collection",
        },
      },
      file7: {
        description:
          "A chip design tutorial from scratch, covering the full flow from Verilog basics, synthesis to placement and routing.",
        tags: {
          a: "Integrated Circuits",
          b: "Chip Design",
          c: "Verilog",
        },
      },
      file8: {
        description:
          "An academic writing guide for non-native English speakers, including common sentence patterns and sample essays.",
        tags: {
          a: "English",
          b: "Academic Writing",
          c: "Guide",
        },
      },
    },
  },

  community: {
    title: "LKM Community",
    subtitle:
      "Welcome to the LKM community, where we share ideas and grow together.",
    forum: {
      title: "Forum",
      subtitle: "Pick a topic and join the discussion!",
      members: "members",
      posts: "posts",
      postsShort: "posts",
      todayPosts: "Today {count}",
      viewAll: "View all",
      latestPosts: "All posts",
      club: "Club board",
      follow: "Follow",
      createPost: "New Post",
      empty: "No posts yet",
      createFirst: "Create the first post",
      applyCollaboration:
        "Apply for collaboration and open your own club board",
      pinned: "Pinned",
      featured: "Featured",
      anonymous: "Anonymous user",
      comments: "{count} comments",
      me: "Me",
      replyTo: "Reply @{name}",
      commentPlaceholder: "Write your comment...",
      ctrlEnterSend: "Ctrl + Enter to send",
      submitComment: "Post Comment",
      reply: "Reply",
      noComments: "No comments yet — be the first to comment",
      justNow: "just now",
      minutesAgo: "{count} minutes ago",
      hoursAgo: "{count} hours ago",
      daysAgo: "{count} days ago",
      createPostTitle: "Create New Post",
      categoryLabel: "Category",
      selectCategory: "Select a category",
      titleLabel: "Title",
      titlePlaceholder: "Enter post title",
      tagsLabel: "Tags (optional, press Enter to add)",
      tagsPlaceholder: "Type a tag and press Enter",
      bodyLabel: "Content (Markdown supported)",
      bodyPlaceholder: "Markdown syntax is supported...",
      markdownHint: "Markdown syntax supported",
      cancel: "Cancel",
      publish: "Publish",
      publishSuccess:
        "Post published!\nTitle: {title}\nCategory: {category}\nTags: {tags}",
      none: "none",
      loginRequired: "Please sign in before publishing",
      publishFailed: "Publish failed, please try again",
      typeDiscussion: "Discussion",
      typeArticle: "Official Article",
      typeColumnPost: "Column",
      typeBlogPost: "Blog post",
      typeQuestion: "Question",
      today: "Today",
      yesterday: "Yesterday",
      countTenThousand: "{count}w",
      report: "Report",
      reportTitle: "Report Post",
      reportSpam: "Spam / advertisement",
      reportMisinformation: "Misinformation",
      reportHarassment: "Harassment",
      reportInfringement: "Copyright infringement",
      reportOther: "Other violations",
      linkCopied: "Link copied to clipboard",
      reportSubmitted:
        "Report submitted: {reason}. We will handle it as soon as possible.",
    },
    columns: {
      title: "Columns",
      subtitle: "High-quality long-form articles by verified authors",
      articles: "articles",
      followers: "followers",
      follow: "Follow column",
      empty: "No articles yet",
      otherInColumn: "More from this column",
      read: "reads",
      likes: "likes",
      comments: "comments",
      verified: "Verified",
      authorBy: "Author: {name} · {title}",
      professional: "Professional certification",
    },
    files: {
      title: "File Library",
      subtitle:
        "Structured resource center for academic materials, datasets and tutorials",
      uploader: "Uploader",
      size: "File size",
      uploadTime: "Upload time",
      downloads: "Downloads",
      times: "times",
      status: "Status:",
      category: "Category: {name}",
      reviewComment: "Review comment: {comment}",
      download: "Download ({points} points)",
      approved: "Approved",
      pending: "Reviewing",
      rejected: "Rejected",
      disclaimerTitle: "Disclaimer:",
      disclaimer:
        "All content is uploaded by users. If you believe your rights are infringed, please notify us via the report feature and we will process it promptly.",
      backToLibrary: "File Library",
    },
    competition: {
      title: "Competition Arena",
      subtitle: "Compete, challenge and grow",
      questionBank: "Question Bank",
      startsAt: "Starts:",
      endsAt: "Ends:",
      duration: "Duration:",
      durationMinutes: "{count} minutes",
      status: "Status:",
      ongoing: "Ongoing",
      upcoming: "Upcoming",
      ended: "Ended",
      participants: "Participants:",
      pending: "TBD",
      enterExam: "Start Exam",
      notFound: "Competition not found",
      questionOf: "Question {current} of {total}",
      previous: "Previous",
      next: "Next",
      answered: "{count}/{total} answered",
      submitExam: "Submit Exam",
      examSubmitted: "Exam submitted! Correct: {correct}/{total} ({percent}%)",
      allDifficulties: "All difficulties",
      difficultyEasy: "★ Easy",
      difficultyMedium: "★★ Medium",
      difficultyHard: "★★★ Hard",
      singleChoice: "Single choice",
      trueFalse: "True/False",
      answer: "Answer:",
      explanation: "Explanation:",
    },
    fileLibrary: {
      title: "File Library",
      breadcrumbAria: "Category path",
      allCategories: "All subjects",
      searchPlaceholder: "Search files…",
      clearSearch: "Clear search",
      noSubcategories: "No subcategories under this category",
      searchResults: 'Searching for "{query}" — {count} files',
      allTypes: "All types",
      zipType: "Archive",
      otherType: "Other",
      allStatuses: "All statuses",
      statusApproved: "Approved ✓",
      statusPending: "Reviewing",
      statusRejected: "Rejected ✗",
      sortNewest: "Newest",
      sortMostDownloaded: "Most downloaded",
      listView: "List view",
      cardView: "Card view",
      downloadCount: "{count} downloads",
      view: "View",
      viewDetails: "View details →",
      noMatchingFiles: "No files match your criteria",
      uploadTitle: "Upload File",
      uploadDropHint: "Click or drag files here",
      uploadFormats: "PDF, ZIP and more, up to 500MB",
      categoryLabel: "Category",
      selectCategory: "Select a category",
      descriptionLabel: "Description",
      descriptionPlaceholder: "Briefly describe the file...",
      cancel: "Cancel",
      submitUpload: "Submit Upload",
      uploadSubmitted:
        "Your file has been submitted and entered the manual review and plagiarism-check queue. You will be notified once approved.",
      fileCount: "{count} files",
    },
  },

  treehole: {
    name: "Treehole",
    anonymous: "Anonymous",
    writeLetter: "✍️ Write a letter",
    randomTreehole: "🎲 Random Treehole",
    backToSite: "Back to main site",
    homeAriaLabel: "Treehole home",
    menu: "Menu",
    switchDay: "Switch to day mode",
    switchNight: "Switch to night mode",

    settings: {
      title: "⚙️ Settings",
      subtitle: "Personalize your treehole experience.",
      themeMode: "🌗 Theme mode",
      themeModeDesc: "Gentle cream daytime / deep night-sky gradient",
      themeDay: "☀️ Day",
      themeNight: "🌙 Night",
      accentColor: "🎨 Custom accent color",
      accentColorDesc: "Click a swatch to change the accent color",
      customAccent: "Custom accent",
      fontSize: "🔤 Font size",
      fontSizeDesc: "Three levels, applied site-wide",
      fontSmall: "Small",
      fontNormal: "Normal",
      fontLarge: "Large",
      whiteNoise: "🌫️ White-noise background music",
      whiteNoiseDesc: "Soft rain, immersive writing",
      highContrast: "👁️ High-contrast eye-care mode",
      highContrastDesc: "Deepen text contrast to relieve eye strain",
      lowPerf: "🐢 Low-performance device effects",
      lowPerfDesc: "Disable heavy effects and particles for smoothness",
      mute: "🔕 Mute site-wide animations",
      muteDesc: "Pause floating particles and transition animations",
      rateLimit: "🚦 Submission rate limit (custom)",
      rateLimitDesc: "Up to {count} letters per minute",
      privacy: "🔒 Privacy statement",
      privacyDesc: "View how your data is stored locally",
      view: "View",
      footNote:
        "Data is stored on the server (anonymous + optional login); posts are shown after review.",
      footNoteLocal:
        "Data is stored in your local browser (anonymous); posts are published to the server database.",
    },

    privacy: {
      title: "Privacy Statement",
      welcomePrefix: "Welcome to ",
      welcomeMiddle: ". This is a ",
      pureAnonymous: "fully anonymous, no sign-up",
      welcomeSuffix: " confessional space:",
      li1Prefix: "Your letters are stored in the ",
      li1Bold: "server database",
      li1Suffix: ", with a randomly generated anonymous codename",
      li2Prefix: "The system does ",
      li2Bold: "not collect any real personal information",
      li2Suffix: "; login is optional",
      li3Prefix: "All submissions are shown publicly only after ",
      li3Bold: "admin review",
      li3Suffix: "",
      li4Prefix: "Random treehole and replies are ",
      li4Bold: "mutually anonymous",
      li4Suffix: ", no identity is exposed",
      tip: "Please pour out your heart rationally and help keep the treehole warm and healing.",
      accept: "I understand, enter the treehole",
    },

    nav: {
      aria: "Main navigation",
      mobileAria: "Mobile navigation",
      bottomAria: "Mobile bottom navigation",
      square: "Square",
      random: "Random",
      bottle: "Bottle",
      wish: "Wish Wall",
      rank: "Ranking",
      write: "Write",
      randomTreehole: "Random Treehole",
      mailbox: "Mailbox",
      myMailbox: "My Mailbox",
      messages: "Messages",
      settings: "Settings",
    },

    home: {
      heroSubtitle:
        "Hand your worries to the wind and keep your secrets in the treehole.",
      slogan: "In the Treehole, be your truest self",
      category: "Category",
      sort: "Sort",
      tag: "Tag",
      all: "All",
      sortNew: "Newest",
      sortHot: "Hottest",
      sortRandom: "Random",
      emptyTitle: "No letters in this category yet",
      emptySub: "Try another category, or write the first anonymous letter~",
      moodCloud: "🏷️ Mood Cloud Wall",
      moodCloudHint: "Click a tag to filter letters by mood",
    },

    letterCard: {
      collapse: "Collapse ▲",
      expand: "Expand ▼",
      copy: "Copy",
      report: "Report",
      sameType: "Similar treeholes ›",
      justNow: "just now",
      minutesAgo: "{count} minutes ago",
      hoursAgo: "{count} hours ago",
      date: "{month}/{day}",
      sharePrefix: "【Treehole】",
    },

    report: {
      title: "Report this letter",
      targetLabel: "Report target:",
      defaultTarget: "Anonymous letter",
      reasonPorn: "Pornography / vulgarity",
      reasonViolence: "Violence / gore",
      reasonAbuse: "Abuse / attack",
      reasonSpam: "Spam / ads",
      reasonOther: "Other violations",
      detailPlaceholder: "Additional details (optional)",
      cancel: "Cancel",
      submit: "Submit report",
    },

    audio: {
      openTitle: "Turn on white noise",
      closeTitle: "Turn off white noise",
      rainLabel: "White noise · rain",
      mutedLabel: "Muted",
    },

    mine: {
      title: "🌙 My Local Treehole",
      subtitle:
        "All your published letters, favorites and drafts, stored in your local browser.",
      statLetters: "Published letters",
      statFavs: "Favorite treeholes",
      statDrafts: "Local drafts",
      tabLetters: "My letters",
      tabFavs: "Favorites",
      tabDrafts: "Local drafts",
      edit: "✏️ Edit",
      delete: "🗑️ Delete",
      continueEdit: "Continue editing",
      emptyLettersTitle: "No letters published yet",
      emptyLettersSub:
        "Go to the write page and send your first anonymous letter~",
      emptyFavsTitle: "No favorite treeholes yet",
      emptyFavsSub: "Star ⭐ letters you like in the square",
      emptyDraftsTitle: "No local drafts",
      emptyDraftsSub: "You can save drafts anytime while writing",
      emptyDraft: "(Empty draft)",
      clearAllTitle: "Clear all local drafts",
      clearAllDesc:
        "Only deletes drafts saved on this device; cannot be undone.",
      clearDraftsBtn: "Clear drafts",
      statusPending: "Reviewing",
      statusPublished: "Published",
      statusRejected: "Rejected",
      statusScheduled: "Scheduled",
      statusSealed: "Sealed",
      statusPrivate: "Visible to me only",
      confirmDelete: "Confirm deletion",
      confirmDeleteLetter: "Delete this letter?",
      confirmDeleteDraft: "Delete this draft?",
      confirmReset: "Confirm reset",
      confirmResetDrafts: "Clear all local drafts?",
      confirmResetDrafts2: "Clear all local drafts? This cannot be undone.",
      clear: "Clear",
      cancel: "Cancel",
      deleted: "Deleted",
      draftsCleared: "Drafts cleared 🌿",
      dateTime: "{month}/{day} {time}",
    },

    backup: {
      title: "💾 Data backup",
      desc: "Export all local data as a JSON file, which can be imported on this device or another browser to restore.",
      exportBtn: "⬇️ Export backup",
      importBtn: "⬆️ Import backup",
      exported: "Backup file exported ✅",
      importSuccess: "Import successful, effective after page refresh ✅",
      importFail: "Import failed: incorrect file format ❌",
    },

    rank: {
      title: "🏆 Popular Treehole Ranking",
      subtitle: "The anonymous letters most gently treated at this moment.",
      todayTab: "Today's hot list",
      weekTab: "This week's ranking",
      emptyTitle: "No ranking data yet",
      emptySub:
        "Like and favorite more letters in the square and the ranking will heat up",
    },

    random: {
      title: "🎲 Random Treehole",
      subtitle: "Draw a stranger's letter, read it quietly, and reply gently.",
      pickTip: "Every draw is an encounter with the unknown",
      drawBtn: "Draw a letter",
      poolHint: "{count} public letters are waiting to be read",
      back: "← Back",
      replyLabel: "Write an anonymous reply to {name}",
      replyPlaceholder:
        "Your reply is also anonymous and won't reveal your identity…",
      sendReply: "📨 Send reply",
      replyNote:
        "🌿 Mutually anonymous: neither side sees the other's true identity; the reply arrives randomly in the other's local inbox.",
      noLetters: "No public letters to draw right now",
      replySent: "Your reply has been delivered anonymously 💌",
      picking: "✨ Drawing...",
      emptyHint: "No public letters yet, go write one~",
      poolHint2: "{count} public letters are waiting to meet you",
      switchLetter: "🎲 Draw another",
    },

    messages: {
      title: "💬 Anonymous Replies",
      subtitle: "Fully anonymous — neither side reveals their true identity.",
      conversations: "Conversations ({count})",
      markRead: "Mark as read",
      blocked: "Blocked",
      emptyConvsTitle: "No conversations yet",
      emptyConvsSub: "Go write a reply to a stranger in the random treehole",
      myCodename: "My codename: {name}",
      block: "Block",
      clear: "Clear",
      delete: "Delete",
      recall: "Recall",
      emptyMsgsTitle: "No messages yet",
      emptyMsgsSub: "Write the first anonymous greeting~",
      replyPlaceholder: "Anonymous reply…",
      send: "Send",
      blockedHint: "This stranger is blocked; messages have stopped.",
      selectConvHint: "Select a conversation on the left to start",
      noMsg: "No messages",
      recalledPrefix: "[Recalled] ",
      mePrefix: "Me: ",
      recalledMsg: "Recalled",
      blockedMsg: "Stranger blocked",
      allReadMsg: "All marked as read",
      confirmBlock:
        "Block this stranger? You won't receive new messages after blocking.",
      confirmClear: "Clear all messages in this conversation?",
      confirmDelete: "Delete this conversation?",
    },

    wish: {
      title: "🌟 Wish Wall",
      subtitle: "Hand your wishes to the starlight and be softly illuminated.",
      makeWish: "+ Make a wish",
      empty: "No wishes yet — be the first to make one~",
      emptyTitle: "No wishes on the wall yet",
      emptySub: "Light up the first star",
      lightWishTitle: "Light up this wish",
      makeDialogTitle: "🌟 Make a wish",
      makeDialogDesc: "Write down your wish so the stars can hear it.",
      makePlaceholder: "I wish...",
      cancel: "Cancel",
      lightWishBtn: "🌟 Light up the wish",
      editTitle: "✏️ Edit wish",
      editPlaceholder: "Edit your wish...",
      save: "💾 Save",
      confirmDelete: "Confirm deletion",
      confirmDeleteWish: "Delete this wish?",
      lightSuccess: "Wish lit up 🌟",
      updateSuccess: "Updated ✏️",
      deleted: "Deleted",
      edit: "✏️ Edit",
      delete: "🗑️ Delete",
    },

    moodChart: {
      monthlyMood: "📊 Monthly Mood",
      recordPrefix: "This month recorded ",
      recordMiddle: " mood entries; most common: ",
      emptyTitle: "No mood records this month",
      emptySub: "Pick a mood tag while writing to enable stats",
    },

    emptyState: {
      defaultTitle: "Nothing here yet",
      defaultSub: "Write the first letter, or browse the treehole square~",
    },

    write: {
      title: "✍️ Write a letter",
      subtitle: "This moment's feelings deserve to be received gently.",
      emoji: "Emoji",
      voice: "Voice to text",
      newline: "New line",
      clear: "Clear",
      contentPlaceholder:
        "Write down your worries, confessions, complaints, or whispers…",
      category: "Letter category",
      privacyLevel: "Privacy level",
      codename: "Anonymous codename",
      codenamePlaceholder: "Leave empty for a random one",
      random: "🎲 Random",
      moods: "Mood tags (multi-select)",
      tags: "Content tags (multi-select, to meet like-minded people)",
      tagsHint:
        "E.g. researchers or grad students can pick 「📚 Academic」 to find kindred spirits.",
      sticker: "Background sticker",
      none: "None",
      paper: "Paper template",
      doodle: "Doodle stationery",
      doodling: "✏️ Drawing...",
      openDoodle: "➕ Start doodling",
      clearDoodle: "Clear",
      saveToPaper: "Save to paper",
      scheduleSeal: "Schedule & seal",
      scheduled: "⏰ Scheduled publishing",
      schedulePlaceholder: "Pick a publishing time",
      seal: "🔒 Time-limited sealing",
      sealUntilPlaceholder: "Seal until",
      sensitiveHit:
        "⚠️ Detected possibly inappropriate content: {words}. Please revise before submitting.",
      captcha: "Captcha (anti-spam)",
      captchaPlaceholder: "Enter the characters above",
      saveDraft: "💾 Save draft",
      clearAll: "🧹 Clear",
      submit: "📮 Send letter",
      submitHint: "Please fill in content and complete the captcha",
      successTitle: "Delivered successfully",
      successPrefix: "Your anonymous letter has been ",
      shareImage: "🖼️ Generate share image",
      writeAnother: "Write another",
      shareBrand: "🌙 Treehole",
      anonymous: "Anonymous",
      saveImage: "💾 Save image",
      emptyDraftMsg: "Content is empty, nothing to save",
      draftSaved: "Draft saved locally 💾",
      noVoiceSupport: "Your browser does not support voice input",
      voiceEnd: "Voice recognition ended",
      doodleSavedText: "[Doodle saved to paper]",
      doodleSavedMsg: "Doodle saved to paper 🎨",
      sensitiveWarning:
        "Contains sensitive words, please revise before submitting",
      rateLimitWarning: "Submitting too frequently, please try again later",
      updatedTip: "Letter updated",
      scheduledTip:
        "Scheduled for publishing, will become public automatically",
      publishedTip: "Letter published to the square",
      privateTip: "Letter saved, visible only to you",
      shareFilename: "treehole_share",
      shareSaved: "Share image saved (SVG)",
      subtitle2:
        "Put your worries, secrets, confessions, or whispers into an envelope and hand it to the treehole.",
      fontSmallTitle: "Smaller font",
      fontNormalTitle: "Normal font",
      fontLargeTitle: "Larger font",
      clearContentTitle: "Clear content",
      clearContent: "🗑️ Clear",
      codenamePlaceholder2: "Auto-generated…",
      enabled: "On",
      disabled: "Off",
      captchaPlaceholder2: "Enter the captcha",
      backToSquare: "🏠 Back to square",
      myMailbox: "📬 My mailbox",
      emptyAlert: "Please write something first~",
      lengthAlert: "Content exceeds the 1000-character limit",
      rateAlert: "Submitting too frequently, please try again later~",
      captchaAlert: "Incorrect captcha",
      updatedTip2: "Letter updated and published!",
      scheduledTip2: "Letter scheduled to publish at {time}",
      publishedTip2:
        "Your letter has been delivered to the treehole, go see everyone's replies~",
      submitFail: "Submission failed, please try again",
      emptyDraftMsg2: "No content yet~",
      draftSaved2: "Draft saved locally!",
    },

    bottle: {
      title: "🍶 Message in a Bottle",
      subtitle:
        "Put your thoughts into a bottle, hand them to the current, and wait for a stranger's reply.",
      throwBtn: "🍶 Throw a bottle",
      seaText: "{count} bottles are drifting in the sea",
      seaSub: "Every bottle holds a story",
      picking: "🌊 Fishing...",
      pickBtn: "🫙 Fish out a bottle",
      stranger: "A stranger from across the sea",
      from: "—— {name}",
      replyPlaceholder: "Write your reply, then put it back into the sea...",
      switchBottle: "← Another bottle",
      sendReply: "📨 Back to the sea",
      replySent: "Your reply has drifted away with the waves 🌊",
      throwDialogTitle: "🍶 Throw a bottle",
      throwDialogDesc:
        "Write what you want to say and let the waves carry it away.",
      throwPlaceholder: "Say something to an unknown someone...",
      cancel: "Cancel",
      throwBtn2: "🍶 Throw into the sea",
    },
  },

  page: {
    loginTitle: "Log in",
    registerTitle: "Sign up",
    accountTitle: "Account Settings",
    resourcesTitle: "Resources",
    backToHome: "← Back to Home",
    resourcesHeading: "External Learning Resources",
    resourcesNote:
      "Below are external academic/education platforms. Content is provided by third parties; please verify before visiting.",
    maintainedBy: "Maintained by QingHan",
    submitLinkHint: "To submit a link, contact the maintainer",
    notFound: {
      title: "Page Not Found",
      error: "Error",
      notFound: "Sorry, this page could not be found.",
      hint: "No worries — head back to the homepage to find more great content.",
      backHome: "Back to Home",
    },

    official: {
      anonymous: "Anonymous member",

      contact: {
        metaTitle: "Contact Us",
        heroTitle: "We'd love to hear from you!",
        formTitle: "Leave Us a Message",
        formSubtitle:
          "If you'd like to join LKM, offer suggestions, or discuss collaboration, please reach out via the form below. You can also check the FAQ first — the answer you need may already be there.",
        nameLabel: "Your name",
        emailLabel: "Email address",
        messageLabel: "Message",
        disclaimerLabel:
          "By submitting this form, you agree that we may collect your personal information in order to reply to you.",
        replyNote: "We usually reply to your message within 24 hours.",
        supportTitle: "Contact Us",
        joinCommunity: "Join the Community",
        joinCommunityDesc:
          "LKM has a well-established QQ community system, covering dozens of groups — grade-level groups, subject groups, and interest clubs.",
        viewAllCommunities: "View all communities",
        cooperation: "Cooperation",
        cooperationDesc:
          "If you're interested in popular-science content collaboration, co-hosting events, or technical support, feel free to reach us through the message form.",
        feedback: "Feedback",
        feedbackDesc:
          "Bug reports and feature suggestions for the website or community can be submitted through the message form. We take every piece of feedback seriously.",
        email: "Email",
        github: "GitHub",
        bilibili: "Bilibili",
        bilibiliDesc:
          "Follow our official Bilibili account for the latest popular-science videos.",
      },

      funding: {
        metaTitle: "Funding System — LKM",
        heading: "System Under Preparation",
        sustainableLine:
          "LKM is committed to sustainable development after balancing revenue and expenses.",
        selfFundedLine:
          "Since the platform launched, the management team has covered servers, domains, and other operating costs out of pocket.",
        planLine:
          "We plan to launch a formal funding system once the platform is running stably.",
        costsTitle: "About Operating Costs",
        serverDomain: "Server and domain costs",
        storageCdn: "File storage and CDN bandwidth",
        smsEmail: "SMS and email services",
        thanksTitle: "Thank you to everyone who supports LKM",
        transparencyNote:
          "We promise that all funds are used transparently, with regular financial reports. If you are interested in sponsoring, feel free to contact us.",
        notOpen: "Coming Soon",
      },

      services: {
        metaTitle: "Services",
        sidebarContent: "Content Creation",
        sidebarEvents: "Community Events",
        sidebarPlatform: "Knowledge Platform",
        heroTitle: "Making Science and Technology Accessible to Everyone",
        heroSubtitle:
          "LKM spreads science and technology and serves the community in many ways — from academic discussions to popular-science content. We are committed to breaking down knowledge barriers and closing information gaps, so more people can feel the charm of technology and the beauty of reason.",
        joinUs: "Join Us",
        contentTitle: "Content Creation",
        contentSubtitle:
          "High-quality content co-created by team members and the community, covering multiple fields of study.",
        newsTitle: "Tech News",
        newsDesc:
          "Track the latest global tech developments and explain new scientific discoveries and breakthroughs in plain language, so you always stay on the pulse of technology.",
        scienceTitle: "Subject Popularization",
        scienceDesc:
          "Covers core subjects such as mathematics, physics, chemistry, biology, and information technology — from basic concepts to frontier theories, guiding you step by step into the world of science.",
        videoTitle: "Video Creation",
        videoDesc:
          "Publish teaching and popular-science videos, as well as hardcore quality content, on platforms like Bilibili, presenting scientific and technical knowledge vividly so abstract axioms and theories become something you can see with your own eyes.",
        helpTitle: "Relevant Help",
        helpDesc:
          "We offer substantive, up-to-date advice on learning, competitions, majors, exams, skills, and career directions — breaking through conventional references and opinions and closing information gaps.",
        deepDiveTitle: "In-depth Features",
        deepDiveDesc:
          "Publish series of feature articles on trending science topics, breaking down the underlying principles in simple terms to cultivate critical thinking and scientific literacy.",
        quizTitle: "Knowledge Competitions",
        quizDesc:
          "Hold regular online subject knowledge competitions that combine education with entertainment, sparking interest in learning and letting members test and consolidate what they have learned in a relaxed atmosphere.",
        resourcesTitle: "Resource Sharing",
        resourcesDesc:
          "Curate and share quality study materials, book recommendations, online courses, and other learning resources, helping community members find the learning path that suits them best.",
        journalTitle: "Science Journal",
        journalDesc:
          "In the future, we will form a journal project group to present the substantive content and achievements produced by the community over the past year or half-year, such as excellent articles, popular-science pieces, and creative works.",
        exchangeTitle: "Domestic & International Exchange",
        exchangeDesc:
          "In the future, we will form a translation team to share and translate quality science papers, articles, explainers, and lecture videos from both China and abroad, achieving two-way input and output.",
        eventsTitle: "Community Events",
        eventsSubtitle:
          "From online seminars to holiday activities, LKM offers community members a rich variety of interactive experiences.",
        holidayTitle: "Holiday Activities",
        holidayDesc:
          "The annual winter and summer themed activities, coordinated by the July Team's Event Planning Department. Featuring online lectures, subject seminars, fun competitions, and more, they are the community's biggest event every year.",
        seminarTitle: "Subject Seminars",
        seminarDesc:
          "Jointly attended by committee members and enthusiasts of various subjects, regular themed seminars dive into in-depth discussion and exchange on specific scientific topics.",
        chatTitle: "Community Communication",
        chatDesc:
          "We run groups for different grade levels and career fields, as well as subject-specific groups, providing precise and efficient spaces for members of different stages and types to communicate.",
        promoTitle: "Promotion",
        promoDesc:
          "Continuously output content through official promotional accounts on platforms such as Bilibili to expand the community's influence and attract more tech-loving partners to join us.",
        platformTitle: "Knowledge Platform",
        platformSubtitle:
          "LKM is building a knowledge management platform for community members to support learning and collaboration.",
        websiteTitle: "Official Website",
        websiteDesc:
          "LKM's online portal, integrating community introduction, team showcase, blog articles, documentation, and resources — our first window to the public.",
        blogTitle: "Blog System",
        blogDesc:
          "Supports publishing articles in Markdown and MDX, with category and tag filtering, reading-time estimation, RSS subscription, and more.",
        ctaTitlePrefix: "Interested in ",
        brandName: "LKM",
        ctaTitleSuffix: "?",
        ctaSubtitle:
          "Whether you want to join the community, submit creative work, or propose a collaboration, we would be delighted.",
      },

      pricing: {
        metaTitle: "Sponsorship & Support",
        heroTitle: "Let Science Spread Further",
        heroSubtitle:
          "LKM is a non-profit community for science and technology enthusiasts. The support of every member is the driving force behind our continued progress.",
        supportTitle: "Ways to Support",
        supportSubtitle:
          "Every bit of effort helps make LKM better. Here are a few ways you can get involved in building the community.",
        joinCommunity: "Join the Community",
        joinCommunityDesc:
          "The most direct way is to join LKM's official QQ groups, follow official accounts, join discussions, share knowledge, and upload files. Every active member is the community's most valuable asset.",
        createContent: "Create Content",
        createContentDesc:
          "We have a long-term call for submissions — help articles, subject articles, popular-science articles, and trending topics, whether as text, video, or any other format, are the substantive content the organization needs most. Your creations let more people feel the charm of technology and benefit from the community's co-creation and sharing system, with the most sincere feedback. Everyone is welcome to contact the News Office to submit.",
        participateMgmt: "Participate in Management",
        participateMgmtDesc:
          "Join the July management team (General Affairs, Community Affairs, Planning, etc.) to take part in daily community operations and event planning, helping the organization achieve its long-term goals, making the community more prosperous, and contributing your talents to LKM's development.",
        participateProject: "Participate in Projects",
        participateProjectDesc:
          "Join the July project teams (textbook writing group, popular-science production group) to deliver concrete output, spread knowledge, and break down barriers and information gaps, bringing knowledge to more children eager to learn.",
        cooperation: "Contact for Cooperation",
        cooperationDesc:
          "If you have resources you're willing to share and would like win-win cooperation, feel free to contact the General Affairs Department. We can discuss collaboration details in depth and build a better community together.",
        promotion: "Promotion",
        promotionDesc:
          "Share LKM's official accounts, vision, events, and quality content with your friends and classmates, so more tech-loving peers know we exist. Every share is a form of dissemination.",
        techSupport: "Technical Support",
        techSupportDesc:
          "If you're skilled in web development, UI design, server operations, or other technical fields, join the Technical Committee and help LKM build a better online platform.",
        suggestions: "Make Suggestions",
        suggestionsDesc:
          "Have any ideas or suggestions for LKM? We would love to hear them. Submit your feedback through the Contact Us page, and we will take every opinion seriously.",
        faqTitle: "FAQ",
        faqSubtitle:
          "Some common questions about ways to support the community — hopefully these answer yours.",
        payQuestion: "Does LKM charge any fees?",
        payAnswer:
          "No. LKM is a non-profit organization; all services and content are free for community members. However, as the community grows, expenses for group member limits, domains, servers, and events keep rising. In the future, we will explore more possible ways to cover operating costs.",
        fundingSource: "Where does LKM's funding come from?",
        fundingSourceAnswer:
          "Currently, it comes from team members' own pockets. That is not sustainable in the long run. In the future, we will try fundraisers and other approaches while continuing to run self-media channels, so we can enter a positive cycle and sustain our operations.",
        transparency: "Are LKM's income and expenses transparent?",
        transparencyAnswer:
          "Yes. All of LKM's funds belong to the collective, not to individuals. Every income and expense is publicized and subject to community oversight. When fundraisers begin, donating members will form a brand-new working group to handle the related matters.",
        multiDept: "Can I join multiple departments?",
        multiDeptAnswer:
          "Of course. We encourage cross-department collaboration. As long as you have the time and energy, you are welcome to contribute in multiple fields. We also encourage members to improve themselves, master more skills, and take on better roles.",
        proposeProject: "Can I proactively propose a project?",
        proposeProjectAnswer:
          "Absolutely. The LKM community belongs to the collective — everyone builds and shares, takes responsibility, and manages matters together. The July team will help set up project groups with management support. We also welcome more creative, leadership-driven, and execution-capable people to join, turn ideas into reality, and help more people!",
        noExperience: "Can I join without relevant experience?",
        noExperienceAnswer:
          "Absolutely. LKM welcomes every partner who wants to learn, contribute, and build. To help everyone get up to speed quickly, we will write a work handbook. Our groups are formed according to members' current abilities, so contributors will never be asked to take on things they cannot yet do.",
        system: "Is there a complete structure within the July team?",
        systemAnswer:
          "Yes. The July team has clearly defined departments and groups, along with management regulations and a member covenant that everyone must follow. Roles can be flexibly adjusted as members develop. As the organization grows, we will establish a clearer promotion system to help everyone grow better.",
        contributionRecord: "How do I view my contribution records?",
        contributionRecordAnswer:
          "Currently, contribution records are mainly shown through the community and the website. In the future, we plan to build a more complete contribution tracking and display system, so that every 'LKM member' feels a sense of belonging and organizational identity.",
        ctaTitle: "Ready to contribute to LKM?",
        ctaSubtitle:
          "Join our community and, together with like-minded partners, let science spread further.",
        contactUs: "Contact Us",
      },

      team: {
        metaTitle: "Management Team — LKM",
        sidebarFounder: "Founders",
        sidebarGeneral: "General Affairs",
        sidebarAffairs: "Community Affairs",
        sidebarEvents: "Event Planning",
        sidebarNews: "News Office",
        sidebarAdvisors: "Advisors",
        sidebarProfessional: "Professional Committee",
        sidebarTech: "Technical Committee",
        sidebarAlumni: "Alumni Members",
        founderTitle: "Founders",
        founderSubtitle: "The starting point of LKM — it all begins here",
        generalTitle: "July Team · General Affairs",
        generalDesc:
          "This department coordinates and plans related matters, leading the team to collaborate and fulfill our shared mission and goals. The General Affairs Department suits members with strong multitasking and execution skills; cross-department needs may arise.",
        affairsTitle: "July Team · Community Affairs",
        affairsDesc:
          "This department maintains community order across platforms, steers the tone within groups, and ensures groups stay active with a continuous, effective atmosphere for learning and discussion — handling issues promptly when they arise. It suits members who regularly stay in a platform community and have some emergency-handling ability.",
        eventsTitle: "July Team · Event Planning",
        eventsDesc:
          "This department is responsible for activities across platforms — full-service from planning to execution — and supervises the Professional Committee, bringing everyone more and better events and experiences so members can truly learn. It suits people with inspiration and creativity, along with the drive to turn it all into reality.",
        newsTitle: "News Office",
        newsDesc:
          "This department keeps the promotional accounts on all platforms running, and handles external affairs — sustaining promotional output, expanding influence, and delivering popular-science content to the public. The News Office will oversee a popular-science project group and a translation project group, to advance the popular-science cause and enable knowledge sharing between domestic and international tech enthusiasts, breaking down information gaps and barriers.",
        advisorsTitle: "Advisors",
        advisorsDesc:
          "This department consists of external advisors to LKM, providing support to LKM's working groups and project teams, such as legal consultation and liaison with other social organizations.",
        professionalTitle: "Professional Committee",
        professionalDesc:
          "This department provides professional knowledge for activities, projects, and more, enriching the practical content of each field. Its members have committed to deepening their expertise; in the future, it will supervise academic project groups, bringing better academic exchange and more.",
        techTitle: "Technical Committee",
        techDesc:
          "This department is responsible for the development and maintenance of the technology behind each platform and activity. In the future, it will bring everyone more practical and better open-source projects. Programming knowledge and website-building skills are needed.",
        alumniHeading: "Alumni or Lost Members",
        alumniNote:
          "The following members once contributed to LKM but are currently unreachable for various reasons. No matter what, the door of LKM is always open to you.",
      },

      projectTeam: {
        metaTitle: "Project Team — LKM",
        sidebarTextbooks: "Textbook Project Group",
        sidebarScience: "Popular-Science Project Group",
        empty: "No members yet — join us!",
      },

      communities: {
        metaTitle: "QQ Communities — LKM",
        sidebarGeneral: "General Enthusiasts Group",
        sidebarGrades: "Grade-Level Groups",
        sidebarGroups: "Grouped Communities",
        sidebarBasic: "Natural/Basic Sciences",
        sidebarApplied: "Applied Sciences",
        sidebarHobby: "Interest Clubs",
        sidebarEvents: "Recurring Activities",
        sidebarLegacy: "Legacy Groups",
      },

      contribution: {
        metaTitle: "Contribution System — LKM",
      },

      follow: {
        metaTitle: "My Follows — LKM",
      },
      timeline: {
        metaTitle: "Timeline — LKM",
      },
    },

    treehole: {
      homeTitle: "Treehole",
      homeDescription:
        "A healing, literary anonymous confession space. Hand your worries to the wind and keep your secrets in the treehole.",
      bottleTitle: "Message in a Bottle — Treehole",
      bottleDescription:
        "Put your thoughts into a bottle, hand them to the current, and wait for a stranger's reply.",
      messagesTitle: "Anonymous Replies — Treehole",
      messagesDescription:
        "Fully anonymous — neither side reveals their true identity.",
      mineTitle: "My Treehole",
      mineDescription:
        "View all your published letters, favorites, and drafts.",
      randomTitle: "Random Treehole",
      randomDescription:
        "Draw a stranger's letter, read it quietly, and reply gently.",
      rankTitle: "Popular Rankings — Treehole",
      rankDescription:
        "The anonymous letters most gently treated at this moment.",
      settingsTitle: "Settings — Treehole",
      settingsDescription: "Personalize your treehole experience.",
      wishTitle: "Wish Wall — Treehole",
      wishDescription:
        "Hand your wishes to the starlight and be softly illuminated.",
      writeTitle: "Write a Letter — Treehole",
      writeDescription:
        "Write down your worries, confessions, complaints, or whispers.",
    },

    admin: {
      dashboard: {
        title: "Dashboard",
      },
      login: {
        metaTitle: "Admin Login",
      },
      categories: {
        title: "Category Management",
        add: "Add Category",
        memberStats: "{members} members · {posts} posts",
        edit: "Edit",
        delete: "Delete",
        disable: "Disable",
      },
      files: {
        title: "File Review",
      },
      posts: {
        title: "Post Management",
      },
      reports: {
        title: "Report Management",
        target: "Target",
        type: "Type",
        reporter: "Reporter",
        reason: "Reason",
        actions: "Actions",
        post: "Post",
        comment: "Comment",
        file: "File",
        handle: "Handle",
        reject: "Reject",
        empty: "No reports",
      },
      moderation: {
        title: "Auto Moderation",
      },
      users: {
        title: "User Management",
      },
      documents: {
        metaTitle: "Document Management — LKM",
        metaDescription: "LKM Admin — Document List",
        title: "Document Management",
        searchPlaceholder: "Search documents...",
        all: "All",
        draft: "Draft",
        published: "Published",
        archived: "Archived",
        newDocument: "New Document",
        loading: "Loading documents...",
        noDocuments: "No documents yet",
        emptyHint: 'Click "New Document" to start writing',
        deleteConfirm:
          'Delete document "{title}"? This action cannot be undone.',
        editorMetaTitle: "Edit Document — LKM",
        editorMetaDescription: "LKM Admin — Document Editor",
        backToDocs: "Back to list",
        loadingEditor: "Loading editor...",
      },
    },

    apps: {
      title: "More Apps",
      description: "All application entries of the LKM community.",
      subtitle: "Entry points for all community apps and services.",
      starHope: {
        name: "StarHope Learning Assistant",
        description:
          "A local-first cross-platform learning tool. Question bank management, smart practice, AI chat, document reading, exam simulation — an all-in-one learning solution.",
      },
      treehole: {
        name: "Treehole",
        description:
          "A healing, literary anonymous confession space. Hand your worries to the wind and keep your secrets in the treehole. Letters, message bottles, a wish wall, and two-way anonymous replies.",
      },
    },

    communityDetail: {
      verified: "Professional certification",
      authorBy: "Author: {name} · {title}",
      followers: "{count} followers",
      articleCount: "{count} articles",
      followColumn: "Follow column",
      readCount: "{count} reads",
      likeCount: "{count} likes",
      commentCount: "{count} comments",
      emptyArticles: "No articles yet",
      columns: "Columns",
      stats: "{views} reads · {likes} likes · {comments} comments",
      otherInColumn: "More from this column",
      articlesCount: "{count} articles",
      likedCount: "{count} likes",
      subscribedCount: "{count} following",
      fansCount: "{count} fans",
      introTitle: "About this column",
      competition: {
        metaTitle: "Competition Details",
        startsAt: "Starts:",
        endsAt: "Ends:",
        duration: "Duration:",
        durationMinutes: "{count} minutes",
        status: "Status:",
        ongoing: "Ongoing",
        upcoming: "Upcoming",
        ended: "Ended",
        participants: "Participants:",
        pending: "TBD",
        enterExam: "Start Exam",
        notFound: "Competition not found",
      },
      files: {
        fileLibrary: "File Library",
        uploader: "Uploader",
        fileSize: "File size",
        uploadTime: "Upload time",
        downloads: "Downloads",
        times: "{count} times",
        status: "Status:",
        statusApproved: "Approved",
        statusPending: "Reviewing",
        statusRejected: "Rejected",
        category: "Category: {name}",
        reviewComment: "Review comment: {comment}",
        download: "Download file (contribution points +5)",
        disclaimerTitle: "Disclaimer:",
        disclaimer:
          "All content is uploaded by users. If you believe your rights are infringed, please notify us via the report feature and we will process it promptly.",
      },
      forum: {
        memberStats: "{members} members · {posts} posts · Today {today}",
        follow: "Follow",
        createPost: "New Post",
        emptyPosts: "No posts yet",
        createFirst: "Create the first post",
        forum: "Forum",
        pinned: "Pinned",
        featured: "Featured",
        views: "{count} views",
        related: "Related posts",
        anonymousUser: "Anonymous user",
        introTitle: "About this board",
        membersTitle: "Members",
        emptyMembers: "No members yet, join us!",
        allMembers: "All members",
        subcategoriesTitle: "Sub-boards",
        subcategoriesEmpty: "No sub-boards yet",
        hotPosts: "Hot discussions",
        backToSquare: "Back to forum",
        membersShort: "{count} people",
        postsShort: "{count} posts",
      },
    },

    qa: {
      title: "Help / Q&A",
      subtitle: "Science helps LKMers, mutual aid and sharing!",
      resolved: "Resolved",
      unresolved: "Unresolved",
      bounty: "{count} points bounty",
      views: "{count} views",
      answers: "{count} answers",
      accepted: "Accepted",
      likes: "{count} likes",
      ask: "Ask a question",
      askAria: "Ask a question",
      closeAria: "Close",
      titleLabel: "Title",
      titlePlaceholder: "Summarize your question in one sentence",
      situationLabel: "About You",
      situationPlaceholder:
        "e.g. province / score / subject choices, grade, background",
      detailLabel: "Detailed Question",
      detailPlaceholder: "Describe your question in detail...",
      insertImage: "Insert image",
      imageAlt: "Question image",
      removeImage: "Remove image",
      bountyPeopleLabel: "Bounty recipients",
      bountyPerPersonLabel: "Points per person",
      bountyMinPlaceholder: "≥1",
      totalBountyLabel: "Total bounty",
      points: "points",
      saveDraft: "Save draft",
      draftSavedToast: "Draft saved",
      publishedToast: "Question published",
      maxImagesToast: "Up to {count} images",
      imageOnlyToast: "Only image files are supported",
      imageTooLargeToast: "Image size must be ≤ 20MB",
      titleRequired: "Please enter a title",
      situationRequired: "Please fill in your situation",
      detailRequired: "Please fill in the detailed question",
      bountyPeopleInvalid: "Bounty recipients must be an integer ≥ 1",
      bountyPerPersonInvalid: "Points per person must be an integer ≥ 1",
      exitConfirmAria: "Exit confirmation",
      exitConfirmMessage:
        "Your draft will not be saved if you exit. Are you sure you want to leave?",
      exitConfirmKeep: "Keep editing",
      exitConfirmExit: "Exit",
      tabHelp: "Help",
      tabVolunteer: "Volunteer / Major recommendations",
      yesterday: "Yesterday",
      daysAgo: "{count} days ago",
    },

    projects: {
      title: "Project Hall",
      pinned: "Pinned",
      incubated: "Incubated by July Team",
      recruiting: "Recruiting",
      recruited: "Recruitment closed",
      showcase: "Showcase",
      initiator: "Initiator: {name} · {date}",
      progress: "Project progress",
      background: "Background",
      goals: "Goals",
      requirements: "Recruitment requirements",
      teamIntro: "Team introduction",
      teamMembers: "Team members",
      recruitingRoles: "Recruiting roles",
      roleMissing: "Missing: {name}",
      reports: "Project reports",
      revisionInitial: "Initial version",
      revisionOne: "First revision",
      revisionTwo: "Second revision",
      revisionN: "Revision {n}",
    },

    articles: {
      title: "Official Articles",
      notFound: "Article not found",
      notExist: "Article does not exist",
      backToList: "Back to article list",
      aboutTitle: "About",
      aboutSubtitle: "About the LKM official website and community",
      whatIs: "What is this",
      whatIsP1:
        "LKM (Lǐkēmí) is a community for science enthusiasts and technology learners, founded in 2014 and composed of many science and technology enthusiasts, covering mathematics, physics, chemistry, biology, information technology and more — bringing science back to everyone.",
      whatIsP2a: "This website is the official site of LKM, built with ",
      whatIsP2b:
        ", using server-side rendering (SSR) with Vue 3 and Tailwind CSS v4, providing a unified online portal for community members.",
      modules: "Website modules",
      modulesIntro:
        "The official website currently includes the following main modules:",
      moduleArticles: "Articles Center",
      moduleArticlesDesc:
        "Official announcements, technical sharing and popular-science content, with category browsing and archiving",
      moduleCommunity: "Community Platform",
      moduleCommunityDesc:
        "Forum, columns, file library, Q&A, project hall, competition, funding system and more",
      moduleAccount: "User Account",
      moduleAccountDesc:
        "Registration / login, personal profile, contribution system and settings",
      moduleTeam: "Team Introduction",
      moduleTeamDesc:
        "Management team and project team showcase, development timeline",
      listColon: ":",
      community: "Community",
      communityP1:
        "The LKM community embraces the concept of co-building and co-sharing: you can join the management team (General Affairs, Community Affairs, News Office, Event Planning, etc.), join a project team (textbook writing project group, popular-science output project group, etc.), submit works, participate in events, and help with promotion.",
      communityP2:
        "Daily community communication relies on QQ groups. All enthusiasts who love reason and science are welcome to join us in exploring the mysteries of how everything works.",
      tech: "Technical notes",
      techIntroA: "This project is a ",
      techIntroStrong: "front-end/back-end separated",
      techIntroB: " website:",
      techList1:
        "The front end is an Astro SSR service responsible for page rendering and interactions",
      techList2a:
        "Data is provided by an independently deployed real back end, with the address specified by the ",
      techList2b: " environment variable",
      techList3a: "The front end reverse-proxies ",
      techList3b: " and ",
      techList3c: " to the real back end through the Astro middleware",
      techList4:
        "Authentication uses real backend JWT authentication, no mock data is stored locally",
      projectInfo: "Project information",
      repoAddress: "Repository address",
      techStack: "Technology stack",
      techStackValue: "Astro v7 (SSR) + Vue 3 + Tailwind CSS v4 + TypeScript",
      archiveTitle: "Article Archive",
      archiveSubtitle: "{count} articles, archived by time",
      loadFailed: "Failed to load: {error}",
      empty: "No articles yet",
      categoriesTitle: "All Categories",
      categoriesSubtitle: "Browse all articles across {count} categories",
      categoryEmpty: "No categories yet",
      backToCategories: "Back to all categories",
      articleCount: "{count} articles",
      categoryEmptyText: "No articles in this category",
    },

    news: {
      title: "News",
      subtitle: "Official announcements, tech news and popular-science content",
      articleCount: "{count} articles",
      viewCategory: "Click to view articles in this category",
      loadFailed: "Failed to load: {error}",
      backToNews: "Back to news",
      categoryEmptyText: "No articles in this category",
    },

    misc: {
      recoveryTitle: "Password Recovery",
      starHopeTitle: "StarHope Learning Assistant",
    },

    resources: {
      ccs: "Chinese Chemical Society",
      smartEdu: "Smart Education of China",
      zhiwu: "iPlant (Zhiwu Zhi)",
      bipm: "International Bureau of Weights and Measures (BIPM)",
      wikipedia: "Wikipedia (English by default)",
    },

    home: {
      metaTitle: "LKM — For Science & Technology Enthusiasts",
      hero: {
        title: "LKM!",
        subtitle: "A Community for Science & Technology Enthusiasts",
        badge: "A community made up of science and technology enthusiasts",
        short:
          "Breaking down professional barriers, so every science enthusiast can find like-minded partners here.",
        long: 'Here, science and technology break free from the rigidity and distance of the academic ivory tower, becoming the curiosity of everyone to burst out and question the world. Within reach, free from utilitarian perspectives, letting more people burst with a thirst for knowledge and feel the beauty of science and engineering. We break down professional barriers, so every "enthusiast" who loves reason and champions science can find like-minded partners here and explore together the mysteries of how everything works.',
        communityIntro: "Community Intro",
        seekHelp: "Get Help",
      },
      resources: {
        title: "External Resource Sites",
        desc: "A collection of academic institutions, research tools and literature sites (currently being improved)",
        goTo: "Go to Resources →",
      },
      explore: {
        title: "Explore",
        subtitle: "Discover what interests you",
        stats: "{members} members · {posts} posts today",
        basicScience: "Basic Sciences",
        appliedScience: "Applied Sciences",
        hobbies: "Interest Boards",
        columns: "Columns",
        columnsStats: "In-depth long reads · Professional certification",
      },
      members: {
        title: "Team Members",
        subtitle: "LKM is more wonderful because of you",
        julyO: {
          name: "July O",
          desc: "PhD from the National Astronomical Observatories of China, Chinese Academy of Sciences, specializing in gravitational waves and black hole physics",
        },
        julyHua: {
          name: "July Hua",
          desc: "A PhD with ideals — dream: every child can access science",
        },
        julyMoran: {
          name: "July Moran",
          desc: "Physics from a non-985/211 university — three thousand days of bitter persistence, gold refined from deep snow",
        },
        julyYuli: {
          name: "July Yuli",
          desc: "Head of the Community Affairs Group — no task is trivial, every effort paints a landscape",
        },
        julyYouzhi: {
          name: "July Youzhi",
          desc: "Former member of the Event Planning Group — pause and forget with the wind; walk on, look around, and stay composed",
        },
        more: "More Members",
        moreHint: "Click to view the full management team",
        viewAll: "View All →",
      },
      timeline: {
        title: "Our Journey",
        subtitle: "Time flows, seasons change",
        items: {
          founding: {
            title: "Ke Qi founds LKM",
            description:
              "Ke Qi created the first group chat — 〔LKM Homestead〕, later renamed several times, such as 〔LKM Alpha Flagship〕. He is the original founder of LKM; most of the community's current framework and institutions are built on what he pioneered.",
          },
          expansion: {
            title: "Group expansion, establishing ties with Baidu Tieba",
            description:
              "The LKM groups entered a rapid expansion phase, absorbing a large number of members from communities such as Baidu Tieba's Physics Bar, Math Bar and Chemistry Bar, with the closest ties to the Physics Bar. Members covered science students and competition participants, and the early admin team was formed by selecting from active members.",
          },
          subjectGroups: {
            title: "Establishment of subject-specific group system",
            description:
              "Subject-specific groups were gradually created: Mathematics (2015.12.22), Physics, Chemistry, Biology (2015.12.25), as well as High School Mathematics, Physics, Chemistry (2016.2.5) and Junior High Mathematics, Biology (2016.2.4). The early subject-group system began to take shape.",
          },
          interestGroups: {
            title: "Continued expansion of interest groups",
            description:
              "Interest groups such as the Physics Tribe group (2016.4.2), Information Technology group (2016.2.5), Tech World group (2016.2.15) and Psychology group (2016.10.7) were established one after another, further enriching the community ecosystem.",
          },
          websitePlanning: {
            title: "Website planning and the News Office vision",
            description:
              "An online website was once planned and briefly trialed, but never officially built and operated. The News Office envisioned at the same time — for publishing tech news — also remained only on paper and never came to fruition.",
          },
          founderStepsBack: {
            title: "The founder steps back; Hua Hua keeps the flame alive",
            description:
              "Ke Qi gradually stepped back due to his studies, and LKM fell into a slump. Hua Hua, the current team leader, took over the founder's responsibilities, personally funding LKM's SVIP and the daily operation of the Physics Tribe — at the time, the tribe required 20 admin actions per week, or the management team would be penalized. Later, Tencent discontinued the tribe feature, all posts disappeared overnight, and the official account was also retired.",
          },
          julyTeamEarly: {
            title: "Early structure of the July Team established",
            description:
              "The July Team's Community Affairs Group (2018.2.19) and General Affairs Group (2018.2.21) were established in succession, along with interest groups for chess, culinary science, HIFI and more. The early management team assembled by Ke Qi laid the institutional foundation for the organization's future operation.",
          },
          qianxunJoins: {
            title: "Qianxun joins the group, a brief revival",
            description:
              "Qianxun joined the LKM group chat, and the long-silent group began to come back to life.",
          },
          qianxunStepsBack: {
            title:
              "Quiet again: Qianxun prepares for the high school entrance exam",
            description:
              "Being still young and needing to focus on preparing for the high school entrance exam, Qianxun gradually stepped back after 2020, and the group went quiet once more. Through all the ups and downs, the first group's member count dropped to just 800.",
          },
          rebuildSeed: {
            title:
              "The call of the group admins, the seed of rebuilding takes root",
            description:
              "Group admins reached out to Qianxun again, saying the group had fewer than 800 members and the community had been silent for long. Qianxun's heart began to waver, and the idea of rebuilding LKM quietly took root.",
          },
          rebuildDecided: {
            title: "Making up the mind, launching the rebuilding plan",
            description:
              "Qianxun formally decided to rebuild and develop LKM, and began explaining the video promotion plan to former team members, laying the groundwork for the promotional push ahead.",
          },
          promoAccount: {
            title: "Official promo account launched, first video goes viral",
            description:
              "The official LKM promo account went live, and its first video gained 7,800+ views. The community quickly regained its activity, and LKM was reborn.",
          },
          officialGroupsReorganized: {
            title: "Official groups reorganized",
            description:
              "Official LKM groups were reorganized, with two sub-groups — 〔LKM · Junior High〕 and 〔LKM · Senior High〕 — providing more tailored spaces for members at different stages.",
          },
          teamAndWebsite: {
            title: "Team building and official website development",
            description:
              "Began recruiting and building a new team, rebuilding the official website and creating a practical knowledge platform for the community.",
          },
          eventPlanningDept: {
            title: "July Team · Event Planning Department founded",
            description:
              "The 〔July Team · Event Planning Department〕 was formed, and planning for the first summer event began. LKM moved from online discussion to organized event operation, turning a new page.",
          },
          firstSummerEvent: {
            title: "First summer event comes to life",
            description:
              "The first summer event took shape. Though organizational details still needed work and more hands were needed, it was a precious attempt that accumulated valuable experience for future events.",
          },
          databaseWipe: {
            title: "Website database wiped, everything back to zero",
            description:
              "The website's database was accidentally wiped, losing all data. This incident made the team deeply realize the importance of backup mechanisms and operational discipline, and became a turning point for the rebuild that followed.",
          },
          rebirth: {
            title:
              "Rebirth: official site rebuilt and second summer prep begins",
            description:
              "Learning from the database wipe, the official site and file library were rebuilt on a more robust architecture. Planning for the second summer event began at the same time, and LKM set off again with a brand-new posture.",
          },
        },
      },
      update: {
        title: "Recent Updates",
        subtitle: "See what has happened recently",
        loading: "Loading...",
      },
      faq: {
        title: "FAQ",
        subtitle:
          "Frequently asked questions about the LKM official website, to help you quickly understand the project and how to use it.",
        whatIs: {
          title: "What is LKM?",
          description:
            "LKM is a community of science and technology enthusiasts, founded in 2014. We break down professional barriers, so everyone who loves reason and champions science can find like-minded partners here and explore together the mysteries of how everything works.",
        },
        howToJoin: {
          title: "How do I join LKM?",
          description:
            "You can join us through the official LKM QQ groups. There are currently two sub-groups — a junior high group and a senior high group — plus complete basic and applied science groups, providing more tailored spaces for members of different stages and fields. For the specific group numbers, please see the Contact Us page.",
        },
        activities: {
          title: "What activities does LKM have?",
          description:
            "LKM regularly holds holiday events, subject seminars, popular-science content creation and more. The July Team's Event Planning Department coordinates these activities — follow our official promo accounts for the latest updates.",
        },
        build: {
          title: "How can I take part in building the community?",
          description:
            "LKM is a community built and shared by everyone. You can join the management team (General Affairs, Community Affairs, News Office, etc.) or a project team (textbook writing project group, popular-science production project group, etc.). You can also submit works and articles, join events, and help with promotion.",
        },
        officialSite: {
          title: "Does LKM have an official website?",
          description:
            "Yes. LKM has an official website — in 2026 we rebuilt it on a more robust architecture to give you a better online experience.",
        },
        contact: {
          title: "How do I get in touch with questions or suggestions?",
          description:
            "Feel free to submit your ideas or questions through the Contact Us page. You can also give feedback directly to the management team in the QQ groups — we take every suggestion seriously.",
        },
      },
    },
  },

  editor: {
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    loadingEditor: "Loading editor...",
    retryingEditor: "Retrying editor load... ({retries}/{total})",
    editorLoadRetryNotice: "Editor load failed, retrying...",
    editorLoadFailed: "Editor failed to load",
    loadErrorDetail:
      "Tried {count} times but the editor still failed to start. Possible causes:",
    loadErrorCache: "Stale dev-server prebuild cache",
    loadErrorNetwork: "Network connection issues",
    loadErrorBrowserCache: "Browser cache conflicts",
    refreshPage: "Refresh page",
    retry: "Try again",
    untitled: "Untitled document",
    startWritingPlaceholder: "Start writing...",
    mdxParseError:
      "MDX parse failed. Please check the source format and try again.",
    comments: "Comments",
    version: "Version",
    noComments:
      "No comments yet. Select text and click the comment button to add one.",
    replyPlaceholder: "Type a reply...",
    send: "Send",
    reopen: "Reopen",
    resolve: "Resolve",
    confirmDeleteComment: "Delete this comment?",
    versionHistory: "Version history",
    noVersions: "No version history",
    restoreThisVersion: "Restore this version",
    confirmRestoreVersion:
      "Restore to version {version}? Unsaved changes will be lost.",
    modeRichtext: "Rich text",
    modeSource: "Source",
    modePreview: "Preview",
    confirmTitle: "Confirm action",
    insertImage: "Insert image",
    imageUrl: "Image URL",
    altText: "Alt text",
    imageDescription: "Image description",
    linkUrl: "Link URL",
    linkText: "Display text",
    linkTextPlaceholder: "Link text",
    removeLink: "Remove link",
    published: "Published",
    archive: "Archive",
    archivedClickToRestore: "Archived — click to restore",
    publish: "Publish",
    confirmArchiveMessage:
      "Archive this document? It cannot be edited after archiving.",
    publishDialogTitle: "Publish document",
    title: "Title",
    documentTitlePlaceholder: "Document title",
    permalink: "Permanent link",
    publishNotice: "The document will be publicly visible after publishing.",
    confirmPublish: "Confirm publish",
    bold: "Bold",
    boldShortcut: "Bold (Ctrl+B)",
    italic: "Italic",
    italicShortcut: "Italic (Ctrl+I)",
    underline: "Underline",
    underlineShortcut: "Underline (Ctrl+U)",
    strike: "Strikethrough",
    inlineCode: "Inline code",
    link: "Link",
    insertLink: "Insert link",
    blockquote: "Blockquote",
    blockquoteTitle: "Blockquote",
    bulletList: "Bullet list",
    orderedList: "Ordered list",
    taskList: "Task list",
    codeBlock: "Code block",
    horizontalRule: "Horizontal rule",
    undo: "Undo",
    undoShortcut: "Undo (Ctrl+Z)",
    redo: "Redo",
    redoShortcut: "Redo (Ctrl+Shift+Z)",
    image: "Image",
    inlineMath: "Inline formula",
    insertInlineMath: "Insert inline formula",
    blockMath: "Block formula",
    insertBlockMath: "Insert block formula",
    table: "Table",
    insertTable3x3: "Insert 3×3 table",
    insertCallout: "Insert callout",
    insertFigure: "Insert figure",
    component: "Components",
    action: "Actions",
    heading1: "Heading 1",
    heading2: "Heading 2",
    heading3: "Heading 3",
    heading4: "Heading 4",
    heading5: "Heading 5",
    heading6: "Heading 6",
    addComment: "Add comment",
    clickToEditFormula: "Click to edit formula",
    me: "Me",

    persistence: {
      writeFailed: "Failed to write the document",
      writeIndexFailed: "Failed to write the document index",
      createFailed: "Failed to create the document",
      updateFailed: "Failed to update the document",
      deleteFailed: "Failed to delete the document",
      indexedDbUnavailable: "IndexedDB is unavailable",
      backupFailed: "Failed to write the backup",
      readBackupsFailed: "Failed to read the backup list",
      readBackupFailed: "Failed to read the backup",
      exportJsonFailed: "Failed to export JSON",
      importJsonFailed: "Failed to import JSON: {message}",
      saveVersionFailed: "Failed to save the version",
      versionMessage: "Version {version}",
    },

    validation: {
      esmForbidden:
        "MDX ESM imports/exports are not allowed for security reasons",
      disallowedProtocol: "Disallowed URL protocol in {nodeType}: {url}",
    },

    slash: {
      heading1Desc: "Heading 1",
      heading2Desc: "Heading 2",
      heading3Desc: "Heading 3",
      bulletList: "Bullet list",
      bulletListDesc: "Bulleted list",
      orderedList: "Numbered list",
      orderedListDesc: "Numbered list",
      taskList: "Task list",
      taskListDesc: "To-do list",
      blockquote: "Blockquote",
      blockquoteDesc: "Blockquote",
      codeBlock: "Code block",
      codeBlockDesc: "Code snippet",
      horizontalRule: "Divider",
      horizontalRuleDesc: "Horizontal divider",
      image: "Image",
      imageDesc: "Insert image",
      table: "Table",
      tableDesc: "Insert table",
      inlineMath: "Inline formula",
      inlineMathDesc: "Insert inline math formula",
      blockMath: "Block formula",
      blockMathDesc: "Insert block math formula",
      calloutDesc: "Callout component",
      figureDesc: "Image component",
      aiContinue: "AI Continue",
      aiContinueDesc: "AI assistant continues the current content",
      aiSummarize: "AI Summarize",
      aiSummarizeDesc: "AI assistant summarizes the current content",
    },

    math: {
      blockFormula: "Block formula",
      inlineFormula: "Inline formula",
      latexFormula: "LaTeX formula",
      latexExample: "e.g. E=mc^2 or \\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}",
      confirmShortcut: "Ctrl+Enter to confirm",
      enterFormulaPreview: "Enter a formula to see the preview here",
      latexSyntaxError: "LaTeX syntax error",
    },

    figure: {
      clickToSetImage: "Click to set image",
      imageUrl: "Image URL",
      altText: "Alt text",
      imageDescription: "Image description",
      caption: "Caption",
      captionPlaceholder: "Figure 1: Description",
      width: "Width (px)",
      auto: "Auto",
      align: "Align",
      alignLeft: "Left",
      alignCenter: "Center",
      alignRight: "Right",
    },

    imageNode: {
      width: "Width",
      height: "Height",
      alignLeft: "Align left",
      alignCenter: "Align center",
      alignRight: "Align right",
      altText: "Alt text",
      replaceImage: "Replace image",
      replace: "Replace",
      deleteImage: "Delete image",
      urlPlaceholder: "Enter image URL",
      altPlaceholder: "Alt text",
    },

    rawMdx: {
      unsupportedInline: "This inline content does not support visual editing",
      unsupportedBlock: "This content does not support visual editing",
      showSource: "Show source",
      hideSource: "Hide source",
      copy: "Copy",
    },

    callout: {
      info: "Info",
      warning: "Warning",
      error: "Error",
      success: "Success",
      hintEdit: "{type} — click to edit properties",
      type: "Type",
      titleOptional: "Title (optional)",
      titlePlaceholder: "Enter title",
    },

    propertyPanel: {
      calloutProps: "Callout properties",
      figureProps: "Image properties",
      properties: "Properties",
      type: "Type",
      info: "Info",
      warning: "Warning",
      error: "Error",
      success: "Success",
      title: "Title",
      imageUrl: "Image URL",
      altText: "Alt text",
      caption: "Caption",
      width: "Width (px)",
      align: "Align",
      alignLeft: "Left",
      alignCenter: "Center",
      alignRight: "Right",
    },

    preview: {
      noImage: "No image",
    },

    saveStatus: {
      saved: "Saved",
      unsaved: "Unsaved changes",
      saving: "Saving...",
      error: "Save failed",
      conflict: "Version conflict",
      words: "{count} words",
      chars: "{count} characters",
    },

    saveToSeries: "Save to series",
    publishAsArticle: "Publish as article",
    publishArticleTitle: "Publish as article",
    publishArticleNotice:
      "Publish the current series file as a blog article. The article will be publicly visible after confirmation.",
    slugLabel: "Slug (article permalink)",
    categoryLabel: "Category",
    categoryPlaceholder: "engineering",
    tagsLabel: "Tags (comma separated)",
    tagsPlaceholder: "react, node",
    publishing: "Publishing…",
    publishArticleSuccess: "Published as article",
    needSaveFirst: "Please save to series before publishing",

    backup: {
      title: "Backup management",
      backup: "Backup",
      exportAll: "Export all documents",
      importDocs: "Import documents",
      restoreFromBackup: "Restore from backup",
      availableBackups: "Available backups ({count})",
      back: "Back",
      noBackups: "No backups",
      noDocsToExport: "No documents to export",
      invalidJsonFormat: "Invalid JSON format: a document array is required",
      formatError: "Format error",
      jsonParseFailed: "JSON parse failed: {message}",
      invalidJsonNoDocs: "No document data in the JSON file",
      importOverwrite:
        "Import {importCount} documents? {existingCount} current documents will be overwritten. Continue?",
      importSuccess: "Successfully imported {count} documents",
      restoreConfirm:
        'Restore "{title}" from backup? Current data will be overwritten.',
    },

    ai: {
      writingAssistant: "AI Writing Assistant",
      settings: "Settings",
      apiUrl: "API URL",
      apiKey: "API Key",
      compatibilityNotice:
        "Compatible with OpenAI / Ollama / LM Studio API formats",
      keyMemoryNotice:
        "The key is only kept in memory on this page and cleared when you refresh or close the page.",
      productionProxyNotice:
        "In production, it is recommended to call through a server-side proxy.",
      saveSettings: "Save settings",
      operation: "Operation",
      selectedText: "Selected text:",
      customPromptOptional: "Custom prompt (optional)",
      customPromptPlaceholder: "Leave empty to use the default prompt",
      sending: "Sending...",
      sendRequest: "Send request",
      insert: "Insert",
      replaceSelection: "Replace selection",
      thirdPartyNotice:
        "Note: your editor content will be sent to a third-party AI service provider for processing. Do not include personal sensitive information.",
      noSelectionOrPrompt: "Please select text first or enter a custom prompt",
      operationContinue: "Continue",
      operationSummarize: "Summarize",
      operationTranslate: "Translate",
      operationRewrite: "Rewrite",
      operationFixGrammar: "Fix grammar",
      operationGenerateTitle: "Generate title",
    },

    tableInsert: {
      tableLabel: "{rows} × {cols} table",
      selectSize: "Select table size",
      gridLabel: "Table size picker",
      cellLabel: "{rows} rows {cols} columns",
    },

    export: "Export",
    exportPdf: "Export PDF",
    exportWord: "Export Word",
    exportMd: "Export MD",
    exportMdx: "Export MDX",
    exportHtml: "Export HTML",
    exportPdfAllowPopup: "Please allow pop-ups to export the PDF",
    exportPdfTitle: "Export PDF",
    exportDocument: "Export document",
    exportDocxTitle: "Export Word document",
    exportFailed: "Export failed: {message}",
    exitFullscreen: "Exit fullscreen",
    enterFullscreen: "Fullscreen editing",
  },

  starhope: {
    appName: "StarHope",
    tagline: "Learning Assistant",
    user: "User",
    logout: "Log out",

    nav: {
      dashboard: "Overview",
      bank: "Question Bank",
      practice: "Practice",
      exam: "Exam",
      wrongBook: "Wrong Book",
      ai: "AI Assistant",
      reader: "Reader",
      plugins: "Plugins",
      settings: "Settings",
    },

    dashboard: {
      greeting: "Hello, {name}",
      welcomeBack: "Welcome back to StarHope Learning Assistant",
      stats: {
        totalQuestions: "Total questions",
        folders: "Folders",
        practiceRecords: "Practice records",
        examRecords: "Exam records",
      },
      shortcutsTitle: "Quick actions",
      shortcuts: {
        bank: { label: "Question Bank", desc: "Create and manage questions" },
        practice: {
          label: "Start Practice",
          desc: "Practice with custom question sets",
        },
        exam: { label: "Mock Exam", desc: "Realistic exam simulation" },
        wrongBook: { label: "Wrong Book", desc: "Review wrong questions" },
        ai: { label: "AI Assistant", desc: "Intelligent learning companion" },
        reader: {
          label: "Document Reader",
          desc: "PDF reading and annotation",
        },
        plugins: { label: "Plugin Center", desc: "Extended features" },
        settings: { label: "App Settings", desc: "Backup and preferences" },
      },
    },

    bank: {
      title: "Question Bank Management",
      summary: "{questions} questions, {folders} folders",
    },

    practice: {
      title: "Practice",
      summary: "{count} questions available",
    },

    exam: {
      title: "Mock Exam",
      summary: "{count} questions available for exams",
    },

    wrongBook: {
      title: "Wrong Book",
      empty: "No wrong questions yet",
    },

    ai: {
      title: "AI Assistant",
      newAgent: "New Assistant",
      clearConversation: "Clear conversation",
      startHint: "Send a message to start the conversation",
      inputPlaceholder:
        "Type a message, Enter to send, Shift+Enter for a new line...",
      send: "Send",
      selectHint: "Select an AI assistant to start the conversation",
    },

    reader: {
      title: "Reader",
      emptyHint: "Upload a PDF to start reading and annotating",
    },

    plugins: {
      title: "Plugin Center",
      lottery: {
        name: "Lottery & Roll Call",
        desc: "Randomly pick questions or call names",
      },
      timer: { name: "Timer", desc: "Exam countdown" },
      calculator: { name: "Calculator", desc: "Scientific calculator" },
    },

    settings: {
      title: "Settings",
      dataManagement: "Data Management",
      exportBank: "Export question bank data",
      exportSuccess: "Export successful",
      exportFailed: "Export failed",
    },

    loginRequired: {
      title: "Login Required",
      message:
        "StarHope uses the unified LKM website account. Please log in before using the learning assistant.",
      goLogin: "Go to log in",
    },
  },

  competitionData: {
    competitions: {
      comp1: {
        title: "2026 Summer Physics Competition",
        description:
          "Covers mechanics, electromagnetism, thermodynamics, optics, and modern physics. Suitable for senior high school students and above.",
        category: "Physics",
      },
      comp2: {
        title: "2026 Mathematical Modeling Challenge",
        description:
          "Teams of three solve real-world problems and submit a paper.",
        category: "Mathematics",
      },
      comp3: {
        title: "2026 Coding Marathon",
        description:
          "A 48-hour extreme coding challenge with no language or tool restrictions.",
        category: "Computer Science",
      },
      comp4: {
        title: "2026 Chemical Equation Balancing Contest",
        description: "A timed challenge to balance chemical equations.",
        category: "Chemistry",
      },
    },
    questions: {
      q1: {
        stem: "What is the approximate speed of light in a vacuum?",
        option0: "3×10⁶ m/s",
        option1: "3×10⁷ m/s",
        option2: "3×10⁸ m/s",
        option3: "3×10⁹ m/s",
        explanation: "The speed of light is c = 299,792,458 m/s ≈ 3×10⁸ m/s",
      },
      q2: {
        stem: "Which of the following forces is not a fundamental force?",
        option0: "Gravity",
        option1: "Electromagnetic force",
        option2: "Friction",
        option3: "Strong nuclear force",
        explanation:
          "Friction is a macroscopic manifestation of the electromagnetic force, not a fundamental force. The four fundamental forces are gravity, the electromagnetic force, the strong interaction, and the weak interaction.",
      },
      q3: {
        stem: "A 2 kg object is acted on by a 10 N force. What is its acceleration?",
        option0: "2 m/s²",
        option1: "5 m/s²",
        option2: "10 m/s²",
        option3: "20 m/s²",
        explanation: "F = ma, so a = F/m = 10/2 = 5 m/s²",
      },
      q4: {
        stem: "Sound can travel in a vacuum.",
        option0: "True",
        option1: "False",
        explanation:
          "Sound is a mechanical wave and needs a medium to propagate, so it cannot travel in a vacuum.",
      },
      q5: {
        stem: "Which of the following is a vector quantity?",
        option0: "Mass",
        option1: "Temperature",
        option2: "Velocity",
        option3: "Time",
        explanation:
          "A vector has both magnitude and direction. Velocity has both, while mass and temperature only have magnitude.",
      },
      q6: {
        stem: "In a closed circuit, when the resistance increases, the current will:",
        option0: "Increase",
        option1: "Decrease",
        option2: "Stay the same",
        option3: "Increase first, then decrease",
        explanation:
          "Ohm's law: I = U/R. When the voltage is constant, a larger resistance means a smaller current.",
      },
      q7: {
        stem: "The value of π (pi) is closest to:",
        option0: "3.12",
        option1: "3.14",
        option2: "3.16",
        option3: "3.18",
        explanation: "π ≈ 3.14159...",
      },
      q8: {
        stem: "Which of the following algorithms has the lowest time complexity?",
        option0: "O(n²)",
        option1: "O(n log n)",
        option2: "O(log n)",
        option3: "O(2ⁿ)",
        explanation:
          "O(log n) grows the slowest. Ordering: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)",
      },
    },
  },

  qaData: {
    questions: {
      q1: {
        title: "Recommended books for getting started with quantum mechanics?",
        content:
          "I am a freshman in the physics department and want to get a head start on quantum mechanics. Are there any beginner-friendly introductory textbooks to recommend? Ideally with a Chinese edition.",
      },
      q2: {
        title:
          "What materials do I need to prepare for the Graduate Entrance Exam Math I?",
        content:
          "Preparing for the 2027 graduate entrance exam, targeting a 985 university. Which reference books and problem sets do I need for Math I? How should I plan my timeline?",
      },
      q3: {
        title: "College application advice: Physics vs Computer Science",
        content:
          "Province: Guangdong\nScore/Rank: 640 / Provincial rank 12000\nSubjects: Physics + Chemistry + Biology\nInterest: Physics, Computer Science\nFamily: Ordinary family, hoping for good job prospects",
      },
      q4: {
        title: "Python Data Analysis: running out of memory with Pandas?",
        content:
          "I always run out of memory when processing a 5GB CSV file with Pandas. I have already used chunked reading, but the subsequent aggregation operations still exhaust the memory. Is there a better approach?",
      },
      q5: {
        title: "Looking for a lab safety regulation document",
        content:
          "I need a template for chemistry laboratory safety regulations, for the safety training of new graduate students. Preferably a standard version commonly used by universities.",
      },
    },
    answers: {
      a1: {
        content:
          'I recommend Griffiths\' "Introduction to Quantum Mechanics" — a Chinese translation is available. If your math foundation is not solid enough, you can start with the Chinese edition "Introduction to Quantum Mechanics" (by David J. Griffiths, translated by Jia Yu). I also recommend reading Volume III of Feynman\'s Lectures on Physics alongside — the physical picture is very clear.',
      },
      a2: {
        content:
          'If you just want a preliminary understanding, I recommend "Does God Play Dice? The History of Quantum Physics" — a very accessible popular-science book. After reading it, you will have a good feel for the ins and outs of quantum mechanics, and then you can move on to textbooks.',
      },
      a3: {
        content:
          "A provincial rank of 12000 in Guangdong is a very good ranking. Physics and computer science are both good choices. From a job-prospect perspective, computer science has a wider job market and a higher starting salary; but if you truly love physics research, you can also major in physics and take computer science courses on the side — the two directions do not conflict. You could consider computer science or physics programs at South China University of Technology or Sun Yat-sen University.",
      },
      a4: {
        content:
          "For a 5GB CSV, I suggest switching tools. If you insist on Python, you can try: 1) Dask DataFrame (almost the same API as Pandas, but distributed) 2) Polars (much more memory-efficient than Pandas) 3) For aggregation, try SQLite (Pandas can write SQL directly). Chunked reading plus chunk-wise aggregation can work, but watch out for the complexity of the aggregation.",
      },
    },
    askers: {
      physicsNewbie: "Physics Newbie",
      examPrepper: "Exam Prep Student",
      chen: "Xiao Chen, Grade 12",
      dataNewbie: "Data Analysis Newbie",
      labWorker: "Chemistry Lab Assistant",
    },
    authors: {
      qiyueO: "July O",
      physicsTeacher: "Physics Teacher",
      qiyueHua: "July Hua",
      zhang: "Engineer Zhang",
    },
    tags: {
      physics: "Physics",
      quantum: "Quantum Mechanics",
      recommendation: "Recommendations",
      math: "Mathematics",
      exam: "Graduate Exam",
      studyPlan: "Study Planning",
      volunteer: "College Application",
      gaokao: "Gaokao",
      guangdong: "Guangdong",
      python: "Python",
      dataProcessing: "Data Processing",
      bigData: "Big Data",
      chemistry: "Chemistry",
      laboratory: "Laboratory",
      documents: "Documents",
    },
  },

  projectData: {
    projects: {
      proj1: {
        name: "Quantum Computing Simulation Platform",
        background:
          "Quantum computing is an important direction for future computing. We plan to build a web-based quantum computing simulation platform to help learners intuitively understand quantum algorithms.",
        goals:
          "Build an 8-qubit quantum circuit simulator that runs in the browser, supporting common quantum gates and measurement.",
        requirements:
          "Need 1-2 frontend developers (React/TypeScript), 1 quantum physics advisor, and 1 UI designer.",
        teamIntro:
          "The initiator July O is a PhD at the Chinese Academy of Sciences in quantum physics. A backend algorithm prototype already exists.",
      },
      proj2: {
        name: "LKM Knowledge Graph",
        background:
          "A lot of high-quality content is scattered across various boards in the community. We want to organize it through a knowledge graph to make it easier to search and learn.",
        goals:
          "Build an LKM community knowledge graph supporting keyword search, related recommendations, and learning path generation.",
        requirements:
          "Need 1 backend developer (Python/graph database), 1 frontend developer (visualization), and several content editors.",
        teamIntro: "",
      },
      proj3: {
        name: "Popular Science Video Series",
        background:
          "Create a popular-science video series for middle school students, explaining scientific principles with vivid and interesting animation and stories.",
        goals:
          "Produce 12 episodes of popular-science videos and publish them on Bilibili and YouTube, aiming for 100k plays.",
        requirements: "",
        teamIntro:
          "A cross-disciplinary team including members from physics, chemistry, and biology. 5 episodes have been published.",
      },
      proj4: {
        name: "Astronomical Observation Data Visualization Project",
        background:
          "Use public astronomical data to create interactive astronomical data visualization works.",
        goals:
          "Build 3 interactive visualization works: a full-sky star catalog, a 3D model of the Milky Way, and a gravitational wave event timeline.",
        requirements: "",
        teamIntro:
          "Composed of astronomy enthusiasts from the community, using a Python + Three.js tech stack.",
      },
    },
    roles: {
      frontend: "Frontend Developer",
      uiDesigner: "UI Designer",
      backend: "Backend Developer",
      contentEditor: "Content Editor",
    },
    teamRoles: {
      initiator: "Initiator",
      generalPlanner: "General Planner",
      animation: "Animation",
      voice: "Voice",
      dataProcessing: "Data Processing",
    },
    names: {
      qiyueO: "July O",
      qiyueMoran: "July Moran",
      qiyueHua: "July Hua",
      astronomyFan: "Astronomy Enthusiast",
      wang: "Animator Wang",
      li: "Voice Actor Li",
      zhang: "Engineer Zhang",
    },
    tags: {
      quantumComputing: "Quantum Computing",
      webDev: "Web Development",
      education: "Education",
      knowledgeGraph: "Knowledge Graph",
      python: "Python",
      community: "Community",
      popularScience: "Popular Science",
      video: "Video",
      astronomy: "Astronomy",
      dataVisualization: "Data Visualization",
      threeJs: "Three.js",
    },
    reports: {
      proj1r0: {
        title: "Project kickoff & requirements analysis complete",
        content:
          "Completed the technical research on quantum circuit simulation, decided the tech stack and architecture, and the backend algorithm prototype is ready.",
      },
      proj1r1: {
        title: "Revision 1: Basic UI framework in place",
        content:
          "Completed the frontend base framework and implemented visualization of single-qubit operations. Recruiting frontend developers to help refine multi-qubit simulation.",
      },
      proj2r0: {
        title: "Project kickoff",
        content:
          "Decided on the Neo4j-based technical solution and preliminarily organized the content taxonomy of the mathematics board.",
      },
      proj3r0: {
        title: "Initial version: first 3 episodes released",
        content:
          '"The Wonderful Journey of Light", "Secrets of the Atom" and "What is a Chemical Reaction" are online on Bilibili, with a total of 35k plays.',
      },
      proj3r1: {
        title: "Revision 1: Mid-term review",
        content:
          "Episodes 4-5 are released, and total plays exceed 80k. Received positive audience feedback; started optimizing the scripts and animation style.",
      },
      proj4r0: {
        title: "Initial version: tech selection & data collection",
        content:
          "Decided to use Three.js for 3D rendering and selected Gaia DR3 stellar data.",
      },
      proj4r1: {
        title: "Revision 1: Full-sky star catalog complete",
        content:
          "The first work is online, showing the distribution of about 1 million stars.",
      },
      proj4r2: {
        title: "Revision 2: 3D Milky Way model complete",
        content:
          "The second work is online — users can rotate/zoom to explore the structure of the Milky Way. Currently working on the gravitational wave timeline.",
      },
    },
  },

  contributionData: {
    achievements: {
      a1: { name: "Newcomer", description: "Complete the onboarding tutorial" },
      a2: { name: "First Post", description: "Publish your first post" },
      a3: { name: "Ten Posts", description: "Publish 10 posts in total" },
      a4: { name: "Featured Author", description: "Get a post featured" },
      a5: { name: "Century Posts", description: "Publish 100 posts in total" },
      a6: { name: "Helpful", description: "Get 5 answers accepted" },
      a7: { name: "Hardcore Answerer", description: "Get 20 answers accepted" },
      a8: {
        name: "File Expert",
        description: "Get 10 uploaded files approved",
      },
      a9: {
        name: "7-Day Streak",
        description: "Check in for 7 consecutive days",
      },
      a10: {
        name: "30-Day Streak",
        description: "Check in for 30 consecutive days",
      },
      a11: { name: "Project Pioneer", description: "Join 3 projects" },
      a12: { name: "Column Author", description: "Publish 5 column articles" },
    },
    pointLogs: {
      checkin: "Daily check-in",
      post: "Post",
      comment: "Comment reply",
      answerAccepted: "Answer accepted",
      fileApproved: "File upload approved",
      competition: "Competition award",
      dailyTask: "Daily task completed",
      like: "Like",
      qaAccept: "Answer accepted",
      transfer: "Points transferred",
    },
    leaderboard: {
      names: {
        qiyueHua: "July Hua",
        qiyueO: "July O",
        physicsLover: "Physics Enthusiast",
        mathGenius: "Math Genius",
        chemMaster: "Chemistry Master",
        qiyueMoran: "July Moran",
        qiyueYuli: "July Yuli",
        astronomyFan: "Astronomy Fan",
        codeWizard: "Code Wizard",
        qiyueYouzhi: "July Youzhi",
      },
      titles: {
        hardcore: "Hardcore Answerer",
        columnAuthor: "Column Author",
        active: "Active User",
        newcomer: "Newcomer",
        fileExpert: "File Expert",
      },
    },
    tasks: {
      t1: { title: "Daily check-in", description: "Come check in today" },
      t2: {
        title: "Post 1 article",
        description: "Share your knowledge and insights",
      },
      t3: {
        title: "Answer 3 questions",
        description: "Help others solve problems",
      },
      t4: { title: "Like 10 posts", description: "Like quality content" },
      t5: {
        title: "Upload 1 file",
        description: "Enrich the community resource library",
      },
    },
    exchangeItems: {
      e1: {
        name: "LKM Custom Badge (Virtual)",
        description: "Exclusive badge shown on your profile page",
      },
      e2: {
        name: "Exclusive Title Color",
        description: "Unlock gold title display",
      },
      e3: {
        name: "Column Article Promotion Slot",
        description:
          "Show your column article in the homepage recommendations for 7 days",
      },
      e4: {
        name: "LKM Custom Notebook",
        description: "Limited-edition LKM-themed notebook",
      },
      e5: { name: "LKM Physical Badge", description: "LKM metal badge" },
      e6: { name: "T-shirt Voucher", description: "LKM-themed T-shirt" },
    },
  },

  notificationData: {
    titles: {
      reply: "New Reply",
      like: "New Like",
      follow: "New Follower",
      fileApproved: "File Approved",
      system: "System Announcement",
    },
    contents: {
      n1: 'Zhang San replied to your post "Quantum Mechanics Introduction"',
      n2: "Li Si liked your comment",
      n3: "Wang Wu followed you",
      n4: 'Your uploaded file "Astrophysics Dataset.zip" has been approved',
      n5: "The LKM 2026 summer competition is about to start — come join!",
      n6: 'Zhao Liu liked your post "Mathematical Modeling Experience"',
    },
  },

  treeholeData: {
    categories: {
      confess: "Confession",
      heart: "Inner thoughts",
      roast: "Rant",
      help: "Seeking help",
      campus: "Campus",
      work: "Work",
      crush: "Secret crush",
      heal: "Healing",
      fun: "Fun",
      insight: "Reflections",
    },
    tags: {
      academic: {
        label: "Academic",
        desc: "Research / grad students / grad school worries",
      },
      campus: { label: "Campus" },
      work: { label: "Work" },
      growth: { label: "Growth" },
      love: { label: "Love" },
      family: { label: "Family" },
      life: { label: "Life" },
    },
    privacy: {
      public: {
        label: "Publicly visible",
        desc: "Shown on the treehole square",
      },
      self: { label: "Visible to me only", desc: "Kept only on this device" },
      random: {
        label: "Random anonymous delivery",
        desc: "Randomly sent to a stranger",
      },
    },
    moods: {
      happy: "Happy",
      sad: "Sad",
      emo: "Emo",
      calm: "Calm",
      anxious: "Anxious",
      expecting: "Anticipating",
      relieved: "Relieved",
      lonely: "Lonely",
      crush: "Smitten",
      tired: "Tired",
      brave: "Brave",
      lost: "Lost",
      grateful: "Grateful",
      wronged: "Wronged",
      healed: "Healed",
      confused: "Confused",
    },
    papers: {
      paper: "Letter",
      starry: "Starry sky",
      minimal: "Minimal",
      art: "Literary",
      campus: "Campus",
    },
    quotes: {
      q1: "You don't need to be great to start, but you need to start to be great.",
      q2: "Let today's unhappiness end here; tomorrow will shine as ever.",
      q3: "Everything has cracks — that is where the light gets in.",
      q4: "Take it slow; all good things happen in the fireworks of life, and in its quiet moments.",
      q5: "You are one of a kind, like the quietest star in the night sky.",
      q6: "Allowing yourself to wilt now and then is how you grow back stronger.",
      q7: "The world is loud, but your heart can stay still.",
      q8: "Tell your worries to the wind — it will keep your secret.",
      q9: "Gentle people will always be treated gently by the world.",
      q10: "Free means undefined.",
      q11: "Trust that after winter, spring will surely come.",
      q12: "Today's effort is the seed of tomorrow's luck.",
      q13: "The moon has no light of its own; borrowing the sun, so can you.",
      q14: "Don't rush for answers; time will reveal them for you.",
      q15: "Life is bright, everything is lovely, and the world is worth it.",
    },
    messages: {
      recalled: "The other person recalled a message",
      decryptFail: "[Decryption failed: wrong password or not encrypted]",
    },
  },

  starhopeData: {
    ai: {
      loadFail: "Failed to load AI assistants",
      createFail: "Failed to create AI assistant",
      defaultAgentName: "General Assistant",
      mockResponse:
        'As your **{name}**, regarding "{question}":\n\nThis is a good learning question. Start from the basics and build up gradually.\n\n> 💡 You can keep asking about the details.',
      errorPrefix: "Error: {message}",
      unknownError: "Unknown error",
    },
  },

  profileTitles: {
    newbie: "Newcomer",
    active: "Active User",
    hardcore: "Hardcore Answerer",
    fileMaster: "File Master",
    projectPioneer: "Project Pioneer",
    columnist: "Columnist",
  },

  adminData: {
    stats: {
      users: "Registered Users",
      posts: "Total Posts",
      pendingFiles: "Pending Files",
      pendingReports: "Pending Reports",
      usersChange: "+12 this week",
      postsChange: "+8 this week",
      filesChange: "3 new",
    },
    categories: {
      physicsAstro: "Physics & Astronomy",
      infoScience: "Computer Science",
      math: "Mathematics",
      socialScience: "Social Sciences",
      integratedCircuit: "Integrated Circuits",
      english: "English",
    },
    reasons: {
      spam: "Spam / ads",
      violation: "Rule-violating content",
      harassment: "Personal attack",
      infringement: "Infringing content",
    },
    posts: {
      titleQuantum:
        "Quantum Mechanics Intro: From Wave Functions to the Schrödinger Equation",
      titlePython: "Python Data Analysis in Practice",
      titleSpam: "Add WeChat xxx, earn 1000 a day",
      titleSensitive: "Sensitive content title",
    },
    files: {
      astroDataset: "Astrophysics Dataset (2026).zip",
      chipTutorial: "Chip Design Intro Tutorial.pdf",
      academicWriting: "English Academic Writing Guide.pdf",
      crackTutorial: "Cracked Software Tutorial.zip",
    },
    reports: {
      targetSpam: "Add WeChat xxx, earn 1000 a day",
      targetComment: "Uncivil comment",
      targetFile: "Suspected infringing file.pdf",
      reporterEnthusiast: "Enthusiastic user",
      reporterAnonymous: "Anonymous",
      reporterCopyright: "Copyright holder",
    },
  },

  newsSections: {
    announcement: "Announcements",
    news: "Tech News",
    science: "Science",
  },

  editorData: {
    errApiUrlRequired: "Please enter the API URL",
    errApiUrlInvalid:
      "Invalid API URL format, please enter a complete HTTPS address",
    errHttpsOnly: "Only HTTPS addresses are supported",
    errCredentials:
      "The API URL cannot contain a username or password. Please enter the API Key separately below.",
    errUnsupportedProtocol: "Unsupported protocol",
    errNotConfigured:
      'Please configure the AI endpoint first. Click "Settings" to enter the API URL and Key.',
    errConfigInvalid: "Invalid AI endpoint configuration: {detail}",
    errNetworkFailed: "Network request failed",
    errNetworkFailedDetail: "Network request failed: {message}",
    errUnexpectedContentType: "The server returned an unexpected content type",
    errStatusCodeSuffix: " (status code {status})",
    errServiceStatus: "AI service returned an error (status code {status})",
    errCheckKey:
      ", please check whether the API Key and endpoint configuration are correct",
    errParseFailed: "Failed to parse the data returned by the AI service",
    errInvalidDataFormat: "The AI service returned an invalid data format",
    errUnknown: "Unknown error",
    errApiKeyInvalid:
      "The AI service returned an error. Please check whether the API Key is valid.",
    errServiceError: "AI service returned an error: {detail}",
    errIncompleteReply:
      "The AI service returned incomplete data (missing reply content)",
    errIncomplete: "The AI service returned incomplete data",
    errMissingMessage:
      "The AI service returned incomplete data (missing message content)",
    errEmptyReply: "The AI service returned an empty reply",
    errTooLarge:
      "The AI response is too large ({bytes} bytes), exceeding the {max}-byte limit",
  },
} as const;
