import { Injectable, computed, signal } from '@angular/core';

export type Lang = 'ar' | 'en';
const STORAGE_KEY = 'library_lang';

// [Arabic, English] for every text on the website.
// Use {name} placeholders for values, and \n for a line break.
const D: Record<string, [string, string]> = {
  // ----- general -----
  'app.title': ['مكتبتي - اقرأ لتسمو', 'My Library - Read to rise'],
  'brand.name': ['مكتبتي', 'My Library'],
  'brand.tagline': ['اقرأ.. لتسمو', 'Read.. to rise'],
  'lang.switch': ['English', 'العربية'],
  'lang.title': ['Switch to English', 'التحويل إلى العربية'],
  'auth.login': ['👤 دخول / تسجيل', '👤 Sign in'],
  'auth.logout': ['تسجيل الخروج', 'Sign out'],
  'c.save': ['حفظ', 'Save'],
  'c.cancel': ['إلغاء', 'Cancel'],
  'c.edit': ['تعديل', 'Edit'],
  'c.delete': ['حذف', 'Delete'],
  'c.close': ['إغلاق', 'Close'],
  'c.actions': ['إجراءات', 'Actions'],
  'c.status': ['الحالة', 'Status'],
  'c.refresh': ['تحديث', 'Refresh'],
  'c.print': ['🖨️ طباعة', '🖨️ Print'],
  'c.all': ['الكل', 'All'],
  'c.search': ['بحث', 'Search'],

  // ----- navigation -----
  'nav.home': ['الرئيسية', 'Home'],
  'nav.browse': ['تصفح الكتب', 'Browse books'],
  'nav.why': ['أهمية القراءة', 'Why read'],
  'nav.about': ['عن المكتبة', 'About'],
  'nav.myLoans': ['استعاراتي', 'My loans'],
  'nav.dashboard': ['لوحة التحكم', 'Dashboard'],
  'nav.books': ['الكتب', 'Books'],
  'nav.students': ['الطلاب', 'Students'],
  'nav.loans': ['الاستعارة والإرجاع', 'Loans & returns'],
  'nav.reports': ['التقارير', 'Reports'],
  'nav.users': ['المستخدمون', 'Users'],
  'account.link': ['حسابي', 'My account'],

  // ----- roles -----
  'role.ADMIN': ['مدير النظام', 'Administrator'],
  'role.LIBRARIAN': ['أمين مكتبة', 'Librarian'],
  'role.STUDENT': ['طالب', 'Student'],

  // ----- loan status -----
  'ls.returned': ['تم الإرجاع', 'Returned'],
  'ls.returnedOn': ['تم الإرجاع {d}', 'Returned {d}'],
  'ls.borrowed': ['مستعار', 'Borrowed'],
  'ls.overdue': ['متأخر', 'Overdue'],
  'ls.overdueDays': ['متأخر {n} يوم', 'Overdue {n} days'],
  'ls.daysOnly': ['{n} يوم', '{n} days'],

  // ----- table headers / fields shared by pages -----
  'f.title': ['العنوان', 'Title'],
  'f.author': ['المؤلف', 'Author'],
  'f.isbn': ['ISBN', 'ISBN'],
  'f.category': ['التصنيف', 'Category'],
  'f.copies': ['عدد النسخ', 'Number of copies'],
  'f.year': ['سنة النشر', 'Publish year'],
  'f.yearShort': ['السنة', 'Year'],
  'f.coverUrl': ['رابط صورة الغلاف (اختياري)', 'Cover image URL (optional)'],
  'f.description': ['نبذة عن الكتاب (اختياري)', 'Book description (optional)'],
  'f.availableTotal': ['المتاح / الإجمالي', 'Available / Total'],
  'f.code': ['كود الطالب', 'Student code'],
  'f.codeShort': ['الكود', 'Code'],
  'f.name': ['الاسم', 'Name'],
  'f.email': ['البريد الإلكتروني', 'Email'],
  'f.emailShort': ['البريد', 'Email'],
  'f.phone': ['الهاتف', 'Phone'],
  'f.student': ['الطالب', 'Student'],
  'f.book': ['الكتاب', 'Book'],
  'f.borrowDate': ['تاريخ الاستعارة', 'Borrow date'],
  'f.dueDate': ['الإرجاع المتوقع', 'Due date'],
  'f.returnDate': ['تاريخ الإرجاع', 'Return date'],
  'f.issuedBy': ['أصدرها', 'Issued by'],
  'f.username': ['اسم المستخدم', 'Username'],
  'f.password': ['كلمة المرور', 'Password'],
  'f.fullName': ['الاسم الكامل', 'Full name'],
  'f.role': ['الصلاحية', 'Role'],

  // ----- book card + counts -----
  'book.available': ['متاح {a} من {t}', 'Available {a} of {t}'],
  'book.unavailable': ['غير متاح حاليًا', 'Currently unavailable'],
  'book.borrowNow': ['استعره الآن', 'Borrow now'],
  'status.available': ['متاح', 'Available'],
  'status.unavailable': ['غير متاح', 'Unavailable'],

  // ----- home -----
  'home.browseBtn': ['تصفح الكتب ←', 'Browse books →'],
  'home.interests': ['📖 تصفح حسب الاهتمام', '📖 Browse by interest'],
  'home.allBooks': ['كل الكتب', 'All books'],
  'home.latest': ['⭐ أحدث الكتب', '⭐ Latest books'],
  'home.noBooks': ['لا توجد كتب في هذا القسم.', 'There are no books in this section.'],
  'home.loadError': ['تعذر تحميل الكتب. تأكد أن الـ Backend شغال.', 'Could not load the books. Make sure the backend is running.'],
  'home.next': ['التالي', 'Next'],
  'home.prev': ['السابق', 'Previous'],
  'slide.1.title': ['استعر كتابك\nفي دقيقة', 'Borrow your book\nin a minute'],
  'slide.1.sub': ['ابحث، اختر الكتاب، واستعره لمدة {days} يومًا بسهولة.', 'Search, pick a book and borrow it for {days} days with ease.'],
  'slide.1.art': ['كتاب واحد\nقد يغيّر يومك', 'One book\ncan change your day'],
  'slide.2.title': ['كتب جديدة ..\nعوالم أوسع', 'New books..\nWider worlds'],
  'slide.2.sub': ['اكتشف كتبًا تلهمك وتساعدك على التعلم والتطور كل يوم.', 'Discover books that inspire you and help you learn and grow every day.'],
  'slide.2.art': ['القراءة\nتمنحك حرية\nأكبر', 'Reading\ngives you\nmore freedom'],
  'slide.3.title': ['اقرأ اليوم\nلتصنع غدك', 'Read today\nto shape tomorrow'],
  'slide.3.sub': ['مكتبة تجمع كتب العلم والبرمجة في مكان واحد.', 'A library that brings science and programming books together.'],
  'slide.3.art': ['اقرأ..\nلتسمو', 'Read..\nto rise'],
  'why.title': ['💡 لماذا القراءة مهمة؟', '💡 Why does reading matter?'],
  'why.1.title': ['توسّع مداركك', 'Expands your mind'],
  'why.1.text': ['كل كتاب نافذة على فكرة جديدة وخبرة لم تعشها.', 'Every book is a window to a new idea and an experience you have not lived.'],
  'why.2.title': ['تقوّي التركيز', 'Strengthens focus'],
  'why.2.text': ['القراءة المنتظمة تدرّب عقلك على الانتباه لفترات أطول.', 'Regular reading trains your mind to pay attention for longer.'],
  'why.3.title': ['تُثري لغتك', 'Enriches your language'],
  'why.3.text': ['مفردات أكثر وتعبير أدق في الكتابة والحديث.', 'More vocabulary and more precise expression in writing and speaking.'],
  'why.4.title': ['تهدّئ التوتر', 'Calms stress'],
  'why.4.text': ['دقائق قليلة مع كتاب تمنحك راحة حقيقية من ضغط اليوم.', 'A few minutes with a book give you real rest from the pressure of the day.'],
  'cta.quote': ['القراءة ليست فقط معرفة.. بل أسلوب حياة', 'Reading is not just knowledge.. it is a way of life'],
  'cta.quoteSub': ['انضم لقرّاء المكتبة وابدأ عادتك اليومية.', 'Join the readers of the library and start your daily habit.'],
  'cta.simpleTitle': ['استعارة بسيطة', 'Simple borrowing'],
  'cta.simpleText': ['{days} يومًا لكل كتاب، وحتى {max} كتب في نفس الوقت.', '{days} days for every book, and up to {max} books at the same time.'],
  'cta.staffTitle': ['للطلاب والعاملين', 'For students and staff'],
  'cta.staffText': ['سجّل دخولك لإدارة الكتب والاستعارات والتقارير.', 'Sign in to manage books, loans and reports.'],
  'cta.dashboard': ['لوحة التحكم', 'Dashboard'],
  'cta.myLoans': ['استعاراتي', 'My loans'],
  'cta.login': ['دخول', 'Sign in'],
  'feat.loan.title': ['استعارة لمدة {days} يومًا', 'Borrow for {days} days'],
  'feat.loan.text': ['وقت كافٍ لإنهاء كتابك', 'Enough time to finish your book'],
  'feat.max.title': ['حتى {max} كتب', 'Up to {max} books'],
  'feat.max.text': ['لكل طالب في نفس الوقت', 'For each student at the same time'],
  'feat.late.title': ['متابعة التأخير', 'Overdue tracking'],
  'feat.late.text': ['تقارير واضحة للكتب المتأخرة', 'Clear reports for late books'],
  'feat.print.title': ['تقارير جاهزة للطباعة', 'Print-ready reports'],
  'feat.print.text': ['بضغطة واحدة', 'With one click'],

  // ----- browse -----
  'browse.title': ['تصفح الكتب', 'Browse books'],
  'browse.count': ['{shown} من {total} كتب', '{shown} of {total} books'],
  'browse.search': ['ابحث بالعنوان أو المؤلف أو التصنيف أو ISBN...', 'Search by title, author, category or ISBN...'],
  'browse.noResults': ['لا توجد نتائج مطابقة.', 'No matching results.'],

  // ----- login -----
  'login.title': ['مرحبًا بك 👋', 'Welcome 👋'],
  'login.sub': ['سجّل الدخول للمتابعة', 'Sign in to continue'],
  'login.submit': ['دخول', 'Sign in'],
  'login.loading': ['جاري الدخول...', 'Signing in...'],
  'login.back': ['العودة للرئيسية', 'Back to home'],
  'login.enterBoth': ['أدخل اسم المستخدم وكلمة المرور', 'Enter your username and password'],

  // ----- books page -----
  'books.title': ['الكتب', 'Books'],
  'books.count': ['{n} كتب في المكتبة', '{n} books in the library'],
  'books.add': ['+ إضافة كتاب', '+ Add book'],
  'books.formAdd': ['إضافة كتاب جديد', 'Add a new book'],
  'books.formEdit': ['تعديل كتاب', 'Edit book'],
  'books.empty': ['لا توجد كتب', 'No books'],
  'books.added': ['تمت إضافة الكتاب', 'Book added'],
  'books.updated': ['تم تعديل الكتاب', 'Book updated'],
  'books.deleted': ['تم حذف الكتاب', 'Book deleted'],
  'books.confirmDelete': ['هل تريد حذف الكتاب: {name} ؟', 'Do you want to delete the book: {name}?'],

  // ----- students page -----
  'students.title': ['الطلاب', 'Students'],
  'students.count': ['{n} طلاب مسجلين', '{n} registered students'],
  'students.add': ['+ تسجيل طالب', '+ Register student'],
  'students.formAdd': ['تسجيل طالب جديد', 'Register a new student'],
  'students.formEdit': ['تعديل بيانات طالب', 'Edit student'],
  'students.history': ['السجل', 'History'],
  'students.historyTitle': ['سجل استعارة: {name}', 'Loan history: {name}'],
  'students.noLoans': ['لا توجد عمليات استعارة', 'No loans yet'],
  'students.empty': ['لا يوجد طلاب', 'No students'],
  'students.added': ['تم تسجيل الطالب', 'Student registered'],
  'students.updated': ['تم تعديل بيانات الطالب', 'Student updated'],
  'students.deleted': ['تم حذف الطالب', 'Student deleted'],
  'students.confirmDelete': ['هل تريد حذف الطالب: {name} ؟', 'Do you want to delete the student: {name}?'],

  // ----- loans page -----
  'loans.title': ['الاستعارة والإرجاع', 'Loans & returns'],
  'loans.active': ['{n} كتب مستعارة حاليًا', '{n} books currently borrowed'],
  'loans.borrowTitle': ['استعارة كتاب', 'Borrow a book'],
  'loans.studentLabel': ['الطالب', 'Student'],
  'loans.bookLabel': ['الكتاب (المتاح فقط)', 'Book (available only)'],
  'loans.chooseStudent': ['-- اختر الطالب --', '-- Choose a student --'],
  'loans.chooseBook': ['-- اختر الكتاب --', '-- Choose a book --'],
  'loans.bookOption': ['{title} (متاح {n})', '{title} ({n} available)'],
  'loans.submit': ['تسجيل الاستعارة', 'Register loan'],
  'loans.rules': [
    'مدة الاستعارة {days} يومًا، والحد الأقصى {max} كتب لكل طالب، ولا يستعير من لديه كتاب متأخر. يمكن التجديد {renews} مرة بإضافة {renewDays} أيام.',
    'Loan period is {days} days, maximum {max} books per student, and a student with an overdue book cannot borrow. A loan can be renewed {renews} time(s) for {renewDays} extra days.',
  ],
  'loans.renewedTag': ['(جُدّدت)', '(renewed)'],
  'loans.return': ['إرجاع', 'Return'],
  'loans.renew': ['تجديد', 'Renew'],
  'loans.empty': ['لا توجد عمليات', 'No loans'],
  'loans.pickBoth': ['اختر الطالب والكتاب', 'Choose a student and a book'],
  'loans.borrowed': ['تمت الاستعارة. تاريخ الإرجاع: {d}', 'Loan registered. Due date: {d}'],
  'loans.returned': ['تم إرجاع الكتاب: {t}', 'Book returned: {t}'],
  'loans.renewedMsg': ['تم تجديد الاستعارة. الموعد الجديد: {d}', 'Loan renewed. New due date: {d}'],

  // ----- reports page -----
  'reports.title': ['التقارير', 'Reports'],
  'reports.sub': ['المستعار حاليًا والمتأخر وسجل الاستعارات', 'Current loans, overdue books and loan history'],
  'reports.borrowedTitle': ['الكتب المستعارة حاليًا ({n})', 'Books currently borrowed ({n})'],
  'reports.overdueTitle': ['الكتب المتأخرة ({n})', 'Overdue books ({n})'],
  'reports.logTitle': ['سجل الاستعارات ({n})', 'Loan history ({n})'],
  'reports.noBorrowed': ['لا توجد كتب مستعارة', 'No borrowed books'],
  'reports.noOverdue': ['لا توجد كتب متأخرة', 'No overdue books'],
  'reports.overdueDays': ['أيام التأخير', 'Days overdue'],
  'reports.from': ['من تاريخ', 'From date'],
  'reports.to': ['إلى تاريخ', 'To date'],
  'reports.export': ['⬇️ تصدير Excel', '⬇️ Export to Excel'],
  'reports.noResults': ['لا توجد نتائج', 'No results'],
  'reports.num': ['رقم', 'No.'],

  // ----- dashboard -----
  'dash.title': ['لوحة التحكم', 'Dashboard'],
  'dash.hello': ['مرحبًا {name} 👋', 'Hello {name} 👋'],
  'dash.newLoan': ['+ استعارة جديدة', '+ New loan'],
  'dash.manageBooks': ['إدارة الكتب', 'Manage books'],
  'dash.stat.titles': ['عنوان كتاب', 'Book titles'],
  'dash.stat.copies': ['النسخ المتاحة', 'Available copies'],
  'dash.stat.students': ['طالب مسجل', 'Registered students'],
  'dash.stat.borrowed': ['مستعار حاليًا', 'Currently borrowed'],
  'dash.stat.overdue': ['كتب متأخرة', 'Overdue books'],
  'dash.recent': ['آخر الاستعارات', 'Latest loans'],
  'dash.overdueTitle': ['الكتب المتأخرة', 'Overdue books'],
  'dash.noLoans': ['لا توجد استعارات بعد', 'No loans yet'],
  'dash.noOverdue': ['لا توجد كتب متأخرة 🎉', 'No overdue books 🎉'],
  'dash.delay': ['التأخير', 'Delay'],

  // ----- users page -----
  'users.title': ['المستخدمون', 'Users'],
  'users.count': ['{n} حسابات في النظام', '{n} accounts in the system'],
  'users.add': ['+ إضافة مستخدم', '+ Add user'],
  'users.formAdd': ['إضافة مستخدم جديد', 'Add a new user'],
  'users.passwordHint': ['كلمة المرور (6 أحرف على الأقل)', 'Password (at least 6 characters)'],
  'users.linkedStudent': ['الطالب المرتبط بالحساب', 'Student linked to the account'],
  'users.chooseStudent': ['-- اختر الطالب --', '-- Choose a student --'],
  'users.thStudent': ['الطالب المرتبط', 'Linked student'],
  'users.resetPassword': ['تغيير كلمة المرور', 'Change password'],
  'users.empty': ['لا توجد حسابات', 'No accounts'],
  'users.added': ['تمت إضافة المستخدم', 'User added'],
  'users.pwChanged': ['تم تغيير كلمة المرور', 'Password changed'],
  'users.deleted': ['تم حذف المستخدم', 'User deleted'],
  'users.promptPw': ['كلمة المرور الجديدة للمستخدم {u} (6 أحرف على الأقل):', 'New password for user {u} (at least 6 characters):'],
  'users.confirmDelete': ['هل تريد حذف المستخدم: {u} ؟', 'Do you want to delete the user: {u}?'],

  // ----- account page -----
  'account.title': ['حسابي', 'My account'],
  'account.sub': ['بياناتك وكلمة المرور', 'Your details and password'],
  'account.subStudent': ['بياناتك وكلمة المرور واستعاراتك', 'Your details, password and loans'],
  'account.info': ['بيانات الحساب', 'Account details'],
  'account.changePw': ['تغيير كلمة المرور', 'Change password'],
  'account.oldPw': ['كلمة المرور الحالية', 'Current password'],
  'account.newPw': ['كلمة المرور الجديدة (6 أحرف على الأقل)', 'New password (at least 6 characters)'],
  'account.confirmPw': ['تأكيد كلمة المرور الجديدة', 'Confirm the new password'],
  'account.myLoans': ['استعاراتي', 'My loans'],
  'account.noLoans': ['لا توجد استعارات', 'No loans'],
  'account.enterBoth': ['أدخل كلمة المرور الحالية والجديدة', 'Enter the current and the new password'],
  'account.mismatch': ['كلمتا المرور الجديدتان غير متطابقتين', 'The new passwords do not match'],
  'account.changed': ['تم تغيير كلمة المرور', 'Password changed'],

  // ----- categories (known names, anything else is shown as typed) -----
  'cat.Programming': ['برمجة', 'Programming'],
  'cat.Web': ['ويب', 'Web'],
  'cat.Software Engineering': ['هندسة البرمجيات', 'Software engineering'],
  'cat.Databases': ['قواعد البيانات', 'Databases'],

  // ----- csv export -----
  'csv.header': [
    'رقم|كود الطالب|الطالب|الكتاب|ISBN|تاريخ الاستعارة|الإرجاع المتوقع|تاريخ الإرجاع|الحالة|أصدرها',
    'No.|Student code|Student|Book|ISBN|Borrow date|Due date|Return date|Status|Issued by',
  ],
  // ----- requests, notifications, password eye, accounts -----
  'nav.requests': ['الطلبات', 'Requests'],
  'nav.notifications': ['إشعاراتي', 'Notifications'],
  'bell.title': ['الإشعارات', 'Notifications'],
  'pw.show': ['إظهار كلمة المرور', 'Show password'],
  'pw.hide': ['إخفاء كلمة المرور', 'Hide password'],
  'req.type.BORROW': ['طلب استعارة', 'Borrow request'],
  'req.type.RETURN': ['طلب إرجاع', 'Return request'],
  'req.status.PENDING': ['بانتظار الموافقة', 'Waiting for approval'],
  'req.status.APPROVED': ['تمت الموافقة', 'Approved'],
  'req.status.REJECTED': ['تم الرفض', 'Rejected'],
  'req.borrowBtn': ['طلب استعارة', 'Request to borrow'],
  'req.returnBtn': ['طلب إرجاع', 'Request return'],
  'req.sent': ['تم إرسال طلبك. بانتظار موافقة أمين المكتبة.', 'Your request was sent. Waiting for the librarian approval.'],
  'req.returnSent': ['تم إرسال طلب الإرجاع. بانتظار تأكيد أمين المكتبة.', 'Return request sent. Waiting for the librarian confirmation.'],
  'req.when': ['وقت الطلب', 'Requested at'],
  'req.type': ['النوع', 'Type'],
  'requests.title': ['طلبات الاستعارة والإرجاع', 'Borrow and return requests'],
  'requests.pendingCount': ['{n} طلبات بانتظار قرارك', '{n} requests waiting for your decision'],
  'requests.none': ['لا توجد طلبات معلّقة', 'No pending requests'],
  'requests.studentStatus': ['حالة الطالب', 'Student status'],
  'requests.activeLoans': ['كتب مستعارة: {a} من {m}', 'Borrowed books: {a} of {m}'],
  'requests.overdueBooks': ['كتب متأخرة: {n}', 'Overdue books: {n}'],
  'requests.copies': ['النسخ المتاحة: {n}', 'Available copies: {n}'],
  'requests.eligible': ['الطالب مؤهل للاستعارة', 'The student is eligible to borrow'],
  'requests.notEligible': ['الطالب غير مؤهل حاليًا. يُنصح بالرفض مع ذكر السبب', 'The student is not eligible now. Rejecting with a reason is recommended'],
  'requests.returnInfo': ['الطالب سلّم الكتاب ويطلب تأكيد الاستلام', 'The student hands the book back and asks you to confirm the receipt'],
  'requests.approve': ['موافقة', 'Approve'],
  'requests.reject': ['رفض', 'Reject'],
  'requests.confirmReject': ['تأكيد الرفض', 'Confirm rejection'],
  'requests.reasonLabel': ['سبب الرفض (سيظهر للطالب)', 'Reason for rejection (the student will see it)'],
  'requests.reasonRequired': ['اكتب سبب الرفض', 'Write the reason for rejection'],
  'requests.approved': ['تمت الموافقة وتم إبلاغ الطالب', 'Approved and the student was notified'],
  'requests.rejected': ['تم الرفض وتم إبلاغ الطالب', 'Rejected and the student was notified'],
  'requests.history': ['آخر القرارات', 'Latest decisions'],
  'requests.decidedBy': ['القرار بواسطة', 'Decided by'],
  'requests.reason': ['السبب / الملاحظة', 'Reason / note'],
  'requests.noHistory': ['لا توجد قرارات بعد', 'No decisions yet'],
  'requests.text.overdue': ['لديك كتب متأخرة. من فضلك أرجعها أولًا ثم أعد الطلب.', 'You have overdue books. Please return them first, then request again.'],
  'requests.text.max': ['وصلت للحد الأقصى من الكتب المستعارة. أرجع كتابًا ثم أعد الطلب.', 'You reached the maximum number of borrowed books. Return a book and request again.'],
  'requests.text.copies': ['لا توجد نسخ متاحة من هذا الكتاب حاليًا.', 'No copies of this book are available now.'],
  'notif.title': ['إشعاراتي', 'My notifications'],
  'notif.sub': ['حالة طلباتك وردود أمين المكتبة', 'The status of your requests and the librarian replies'],
  'notif.empty': ['لا توجد إشعارات أو طلبات بعد', 'No notifications or requests yet'],
  'notif.new': ['جديد', 'New'],
  'notif.reason': ['السبب: {r}', 'Reason: {r}'],
  'notif.note': ['ملاحظة أمين المكتبة: {r}', 'Librarian note: {r}'],
  'notif.waiting': ['طلبك وصل لأمين المكتبة وهو بانتظار قراره', 'Your request reached the librarian and is waiting for the decision'],
  'users.createStudentAccounts': ['إنشاء حسابات للطلاب بدون حساب', 'Create accounts for students without one'],
  'users.accountsCreated': ['تم إنشاء {n} حساب', '{n} accounts created'],
  'users.noMissing': ['كل الطلاب لديهم حسابات بالفعل', 'All students already have accounts'],
  'users.defaultPwNote': ['هذه كلمة المرور الأولية. اطلب من كل طالب تغييرها بعد أول دخول.', 'This is the initial password. Ask every student to change it after the first login.'],
  'account.loanActions': ['إجراء', 'Action'],

};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(this.initial());
  readonly isRtl = computed(() => this.lang() === 'ar');

  constructor() {
    this.apply(this.lang());
  }

  toggle() {
    const next: Lang = this.lang() === 'ar' ? 'en' : 'ar';
    this.lang.set(next);
    this.apply(next);
  }

  // Reads the current language signal, so every template using it updates when the language changes
  t(key: string, params?: Record<string, string | number>): string {
    const entry = D[key];
    if (!entry) return key;
    let text = this.lang() === 'ar' ? entry[0] : entry[1];
    if (params) {
      for (const name of Object.keys(params)) {
        text = text.split('{' + name + '}').join(String(params[name]));
      }
    }
    return text;
  }

  // Arabic: 1-2 كتاب, 3+ كتب. English: 1 book, otherwise books.
  booksCount(n: number): string {
    if (this.lang() === 'ar') return n + (n <= 2 ? ' كتاب' : ' كتب');
    return n + (n === 1 ? ' book' : ' books');
  }

  // Name of a category in the current language (unknown categories are shown as typed)
  categoryName(name: string): string {
    const entry = D['cat.' + name];
    if (!entry) return name;
    return this.lang() === 'ar' ? entry[0] : entry[1];
  }

  private apply(lang: Lang) {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = D['app.title'][lang === 'ar' ? 0 : 1];
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // storage can be blocked, the language just will not be remembered
    }
  }

  private initial(): Lang {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') return saved;
    } catch {
      // ignore
    }
    return 'ar';
  }
}
