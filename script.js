const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbym4rVEUWd0xkp9JglZNkZp6Hse6IxGSkHgqqKsi05GJhwe2AD95Z1-bGCv7dhWMLBqXQ/exec'; // تأكد أن هذا الرابط هو الصحيح لتطبيق الويب الخاص بك (خاص بالإرسال)

// تعريف المتغيرات لتخزين البيانات المحملة
let productsData = [];
let inventoryProductsData = []; // بيانات منتجات الجرد
let salesRepresentatives = [];
let customersMain = [];
let visitOutcomes = [];
let visitPurposes = [];
let visitTypes = [];

let visitCounter = 0; // لتعقب عدد الزيارات المضافة ديناميكيًا
let visitGroupID = `GROUP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`; // معرف فريد للزيارات المتعددة ضمن نفس الإرسال

// الحصول على عناصر DOM الأساسية
const visitForm = document.getElementById('visitForm');
const entryUserNameInput = document.getElementById('entryUserName'); // جديد: اسم الموظف المدخل
const customerNameInput = document.getElementById('customerName');
const customerListDatalist = document.getElementById('customerList');
const visitTypeSelect = document.getElementById('visitType');
const visitPurposeSelect = document.getElementById('visitPurpose');
const visitOutcomeSelect = document.getElementById('visitOutcome');
const salesRepNameSelect = document.getElementById('salesRepName');
const customerTypeSelect = document.getElementById('customerType');
const submitBtn = document.getElementById('submitBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const productsDisplayDiv = document.getElementById('productsDisplay');
const productCategoriesDiv = document.getElementById('productCategories');
const inventoryItemsContainer = document.getElementById('inventoryItemsContainer');
const addInventoryItemBtn = document.getElementById('addInventoryItem');
const inventorySectionDiv = document.getElementById('inventorySection'); // قسم الجرد بالكامل
const normalVisitRelatedFieldsDiv = document.getElementById('normalVisitRelatedFields');
const normalProductSectionDiv = document.getElementById('normalProductSection');
const clientVisitHistoryBox = document.getElementById('clientVisitHistoryBox');
const addVisitEntryBtn = document.getElementById('addVisitEntry');
const visitEntriesContainer = document.getElementById('visitEntriesContainer');
const notesTextarea = document.getElementById('notes');


// ---------------------------------------------------
// الدوال المساعدة لجلب البيانات من ملفات JSON المحلية
// ---------------------------------------------------
async function fetchJsonData(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} from ${filePath}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching local JSON data:', error);
        Swal.fire('خطأ!', 'فشل في تحميل البيانات الأساسية من ' + filePath + '، يرجى التأكد من وجود الملفات في نفس المجلد: ' + error.message, 'error');
        return [];
    }
}

// دالة تحميل جميع البيانات الأولية من ملفات JSON المحلية
async function loadAllData() {
    [
        productsData,
        inventoryProductsData,
        customersMain,
        visitOutcomes,
        visitPurposes,
        visitTypes,
        salesRepresentatives
    ] = await Promise.all([
        fetchJsonData('products.json'),
        fetchJsonData('inventory_products.json'),
        fetchJsonData('customers_main.json'),
        fetchJsonData('visit_outcomes.json'),
        fetchJsonData('visit_purposes.json'),
        fetchJsonData('visit_types.json'),
        fetchJsonData('sales_representatives.json') // هذا سيجلب مصفوفة من السلاسل النصية
    ]);

    // تعبئة Datalist للعملاء
    populateDatalist(customerListDatalist, customersMain, 'Customer_Name_AR');

    // تعبئة قوائم الاختيار (Select)
    // لـ salesRepresentatives: يتم تحويل مصفوفة السلاسل النصية إلى مصفوفة كائنات
    populateSelect(salesRepNameSelect, salesRepresentatives.map(name => ({ Sales_Rep_Name_AR: name })), 'Sales_Rep_Name_AR');
    populateSelect(visitTypeSelect, visitTypes, 'Visit_Type_Name_AR');
    populateSelect(visitPurposeSelect, visitPurposes, 'Visit_Purpose_AR');
    populateSelect(visitOutcomeSelect, visitOutcomes, 'Visit_Outcome_AR');

    // تعبئة Datalist لمنتجات الجرد
    populateDatalist(document.getElementById('inventoryList'), inventoryProductsData, 'Product_Name_AR');

    // إعداد أزرار فئات المنتجات للزيارة العادية
    setupProductCategories(productsData);
}

// دالة لتعبئة عنصر <datalist>
function populateDatalist(datalistElement, data, valueField) {
    datalistElement.innerHTML = ''; // مسح الخيارات الموجودة
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueField];
        datalistElement.appendChild(option);
    });
}

// دالة لتعبئة عنصر <select>
function populateSelect(selectElement, data, valueField) {
    selectElement.innerHTML = '<option value="">اختر</option>'; // الخيار الافتراضي
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueField];
        option.textContent = item[valueField];
        selectElement.appendChild(option);
    });
}

// دالة لعرض رسائل النجاح
function showSuccessMessage(message = 'تم الإرسال بنجاح!') {
    Swal.fire({
        title: 'نجاح!',
        text: message,
        icon: 'success',
        confirmButtonText: 'حسناً'
    });
}

// دالة لعرض رسائل الخطأ
function showErrorMessage(message = 'حدث خطأ ما.') {
    Swal.fire({
        title: 'خطأ!',
        text: message,
        icon: 'error',
        confirmButtonText: 'حسناً'
    });
}

// دالة لعرض رسائل التحذير
function showWarningMessage(message = 'تحذير.') {
    Swal.fire({
        title: 'تنبيه!',
        text: message,
        icon: 'warning',
        confirmButtonText: 'حسناً'
    });
}

// ---------------------------------------------------
// وظائف إدارة أقسام الزيارة والجرد
// ---------------------------------------------------

// دالة لتبديل عرض الأقسام بناءً على نوع الزيارة
function toggleVisitSections(visitType) {
    const isInventoryVisit = visitType === 'جرد استثنائي';
    inventorySectionDiv.classList.toggle('hidden', !isInventoryVisit);
    normalVisitRelatedFieldsDiv.classList.toggle('hidden', isInventoryVisit);
    normalProductSectionDiv.classList.toggle('hidden', isInventoryVisit);
    clientVisitHistoryBox.classList.toggle('hidden', isInventoryVisit);

    // إعادة تعيين حقول المنتجات والزيارات عند التبديل
    productsDisplayDiv.innerHTML = ''; // مسح المنتجات المعروضة
    visitEntriesContainer.innerHTML = ''; // مسح زيارات المنتجات المتعددة
    visitCounter = 0; // إعادة تعيين عداد الزيارات
    addVisitEntry(); // إضافة أول زيارة بشكل افتراضي للزيارات العادية
}


// ---------------------------------------------------
// وظائف إدارة المنتجات للزيارات العادية
// ---------------------------------------------------

// إعداد أزرار فئات المنتجات
function setupProductCategories(products) {
    productCategoriesDiv.innerHTML = '';
    const categories = [...new Set(products.map(p => p.Category))]; // الحصول على الفئات الفريدة

    categories.forEach(category => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'category-btn bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium ml-2 mb-2';
        button.textContent = category;
        button.dataset.category = category;
        button.addEventListener('click', () => displayProductsByCategory(category));
        productCategoriesDiv.appendChild(button);
    });
}

// عرض المنتجات بناءً على الفئة المختارة
function displayProductsByCategory(category) {
    productsDisplayDiv.innerHTML = '';
    const filteredProducts = productsData.filter(p => p.Category === category);

    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card bg-white p-4 rounded-lg shadow-sm border border-gray-200';
        productCard.innerHTML = `
            <h4 class="font-semibold text-gray-800">${product.Product_Name_AR}</h4>
            <div class="flex items-center mt-2">
                <label for="quantity-${product.Product_Code}" class="sr-only">الكمية</label>
                <input type="number" id="quantity-${product.Product_Code}" class="product-quantity w-20 p-2 border border-gray-300 rounded-md text-center" value="0" min="0" data-product-code="${product.Product_Code}">
                <span class="text-gray-600 ml-2">كمية</span>
            </div>
            <div class="mt-2">
                <input type="radio" id="good-${product.Product_Code}" name="condition-${product.Product_Code}" value="جيد" checked>
                <label for="good-${product.Product_Code}" class="mr-2">جيد</label>
                <input type="radio" id="damaged-${product.Product_Code}" name="condition-${product.Product_Code}" value="تالف">
                <label for="damaged-${product.Product_Code}">تالف</label>
            </div>
        `;
        productsDisplayDiv.appendChild(productCard);
    });
}

// ---------------------------------------------------
// وظائف إدارة الزيارات المتعددة (أقسام المنتجات داخل الزيارة)
// ---------------------------------------------------

function addVisitEntry() {
    visitCounter++;
    const visitEntryId = `visitEntry-${visitCounter}`;
    const template = `
        <div id="${visitEntryId}" class="visit-entry bg-blue-50 p-6 rounded-xl border border-blue-300 mb-6 relative">
            <h3 class="text-lg font-bold text-blue-800 mb-4">تفاصيل المنتجات للزيارة ${visitCounter}</h3>
            <button type="button" class="removeVisitEntry absolute top-2 left-2 text-red-600 text-sm">❌ حذف</button>
            <div class="form-group">
                <label for="visitType-${visitCounter}">نوع الزيارة</label>
                <select id="visitType-${visitCounter}" name="Visit_Type_Name_AR" class="mt-1 visit-type-select" required>
                    <option value="">اختر نوع الزيارة</option>
                </select>
            </div>
            <div class="form-group">
                <label for="visitPurpose-${visitCounter}">الغرض من الزيارة</label>
                <select id="visitPurpose-${visitCounter}" name="Visit_Purpose" class="mt-1" required>
                    <option value="">اختر الغرض</option>
                </select>
            </div>
            <div class="form-group">
                <label for="visitOutcome-${visitCounter}">نتائج الزيارة</label>
                <select id="visitOutcome-${visitCounter}" name="Visit_Outcome" class="mt-1" required>
                    <option value="">اختر النتيجة</option>
                </select>
            </div>
            <div class="product-selection-area bg-gray-50 p-4 rounded-lg mt-4">
                <h4 class="font-semibold text-gray-700 mb-3">اختر المنتجات</h4>
                <div class="product-categories-entry flex flex-wrap gap-2 mb-4">
                    </div>
                <div class="products-display-entry grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    </div>
            </div>
            <div class="form-group mt-4">
                <label for="notes-${visitCounter}">ملاحظات خاصة بالزيارة ${visitCounter}</label>
                <textarea id="notes-${visitCounter}" name="Visit_Notes" rows="2" class="mt-1" placeholder="ملاحظات خاصة بهذه الزيارة..."></textarea>
            </div>
        </div>
    `;
    const newEntry = document.createRange().createContextualFragment(template);
    visitEntriesContainer.appendChild(newEntry);

    // تعبئة قوائم الاختيار للمدخل الجديد
    const newVisitTypeSelect = document.getElementById(`visitType-${visitCounter}`);
    const newVisitPurposeSelect = document.getElementById(`visitPurpose-${visitCounter}`);
    const newVisitOutcomeSelect = document.getElementById(`visitOutcome-${visitCounter}`);

    populateSelect(newVisitTypeSelect, visitTypes, 'Visit_Type_Name_AR');
    populateSelect(newVisitPurposeSelect, visitPurposes, 'Visit_Purpose_AR');
    populateSelect(newVisitOutcomeSelect, visitOutcomes, 'Visit_Outcome_AR');

    // إعداد فئات المنتجات ومنتجاتها للزيارة الجديدة
    const newProductCategoriesDiv = newEntry.querySelector('.product-categories-entry');
    const newProductsDisplayDiv = newEntry.querySelector('.products-display-entry');

    // إعادة استخدام نفس دالة إعداد الفئات ولكن توجيهها لعناصر DOM الخاصة بالزيارة الجديدة
    setupProductCategoriesForEntry(newProductCategoriesDiv, newProductsDisplayDiv, productsData);
}

// دالة مساعدة لإعداد فئات المنتجات لمدخل زيارة محدد
function setupProductCategoriesForEntry(categoriesDiv, productsDisplayDiv, products) {
    categoriesDiv.innerHTML = '';
    const categories = [...new Set(products.map(p => p.Category))];

    categories.forEach(category => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'category-btn bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium ml-2 mb-2';
        button.textContent = category;
        button.dataset.category = category;
        button.addEventListener('click', () => displayProductsForEntry(productsDisplayDiv, category));
        categoriesDiv.appendChild(button);
    });
}

// دالة مساعدة لعرض المنتجات لمدخل زيارة محدد
function displayProductsForEntry(productsDisplayDiv, category) {
    productsDisplayDiv.innerHTML = '';
    const filteredProducts = productsData.filter(p => p.Category === category);

    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card bg-white p-4 rounded-lg shadow-sm border border-gray-200';
        productCard.innerHTML = `
            <h4 class="font-semibold text-gray-800">${product.Product_Name_AR}</h4>
            <div class="flex items-center mt-2">
                <label for="entry-quantity-${product.Product_Code}-${visitCounter}" class="sr-only">الكمية</label>
                <input type="number" id="entry-quantity-${product.Product_Code}-${visitCounter}" class="product-quantity-entry w-20 p-2 border border-gray-300 rounded-md text-center" value="0" min="0" data-product-code="${product.Product_Code}" data-visit-id="${visitCounter}">
                <span class="text-gray-600 ml-2">كمية</span>
            </div>
            <div class="mt-2">
                <input type="radio" id="entry-good-${product.Product_Code}-${visitCounter}" name="entry-condition-${product.Product_Code}-${visitCounter}" value="جيد" checked>
                <label for="entry-good-${product.Product_Code}-${visitCounter}" class="mr-2">جيد</label>
                <input type="radio" id="entry-damaged-${product.Product_Code}-${visitCounter}" name="entry-condition-${product.Product_Code}-${visitCounter}" value="تالف">
                <label for="entry-damaged-${product.Product_Code}-${visitCounter}">تالف</label>
            </div>
        `;
        productsDisplayDiv.appendChild(productCard);
    });
}


// ---------------------------------------------------
// وظائف إدارة الجرد الاستثنائي
// ---------------------------------------------------

// دالة لإضافة حقل منتج جرد جديد
function addInventoryItem() {
    const itemIndex = inventoryItemsContainer.children.length; // استخدام الطول كمعرف فريد مبدئي
    const template = `
        <div class="inventory-item bg-orange-50 p-4 rounded-lg border border-orange-300 mb-4 relative">
            <h4 class="font-semibold text-orange-800 mb-3">منتج الجرد #${itemIndex + 1}</h4>
            <button type="button" class="removeInventoryItem absolute top-2 left-2 text-red-600 text-sm">❌ حذف</button>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group">
                    <label for="inventoryProductName-${itemIndex}">اسم المنتج</label>
                    <input type="text" id="inventoryProductName-${itemIndex}" list="inventoryList" name="Inventory_Product_Name" class="mt-1" required placeholder="ابحث عن منتج..." />
                </div>
                <div class="form-group">
                    <label for="inventoryQuantity-${itemIndex}">الكمية</label>
                    <input type="number" id="inventoryQuantity-${itemIndex}" name="Inventory_Quantity" min="1" class="mt-1" required placeholder="أدخل الكمية" />
                </div>
                <div class="form-group">
                    <label for="expirationDate-${itemIndex}">تاريخ الانتهاء</label>
                    <input type="date" id="expirationDate-${itemIndex}" name="Expiration_Date" class="mt-1" />
                </div>
                <div class="form-group">
                    <label for="unitLabel-${itemIndex}">الوحدة</label>
                    <select id="unitLabel-${itemIndex}" name="Unit_Label" class="mt-1" required>
                        <option value="">اختر الوحدة</option>
                        <option value="كرتون">كرتون</option>
                        <option value="علبة">علبة</option>
                        <option value="باكت">باكت</option>
                        <option value="حبة">حبة</option>
                        <option value="كيلو">كيلو</option>
                        <option value="جرام">جرام</option>
                        <option value="لتر">لتر</option>
                        <option value="ملي">ملي</option>
                        <option value="شد">شد</option>
                    </select>
                </div>
                 <div class="form-group">
                    <label for="inventoryNotes-${itemIndex}">ملاحظات المنتج (اختياري)</label>
                    <textarea id="inventoryNotes-${itemIndex}" name="Inventory_Notes" rows="2" class="mt-1" placeholder="ملاحظات خاصة بهذا المنتج..."></textarea>
                </div>
            </div>
        </div>
    `;
    const initialItem = document.createRange().createContextualFragment(template);
    inventoryItemsContainer.appendChild(initialItem);
}

// دالة لتجميع المنتجات المكررة في الجرد لتجنب الصفوف المكررة في شيت قوقل
function consolidateInventoryItems(items) {
    const consolidated = {};
    items.forEach(item => {
        // مفتاح فريد لكل منتج بناءً على الكود وتاريخ الانتهاء والوحدة
        const key = `${item.Product_Code}-${item.Expiration_Date}-${item.Unit_Label}`;
        if (consolidated[key]) {
            // إذا كان المنتج موجودًا، قم بزيادة الكمية وتحديث الملاحظات
            consolidated[key].Quantity += item.Quantity;
            if (item.Notes && !consolidated[key].Notes.includes(item.Notes)) {
                consolidated[key].Notes += (consolidated[key].Notes ? ' | ' : '') + item.Notes;
            }
        } else {
            // إذا كان منتجًا جديدًا، أضفه إلى القائمة الموحدة
            consolidated[key] = { ...item };
        }
    });
    return Object.values(consolidated);
}

// ---------------------------------------------------
// دالة معالجة إرسال النموذج
// ---------------------------------------------------

async function handleSubmit(event) {
    event.preventDefault();
    submitBtn.disabled = true;
    loadingSpinner.classList.remove('hidden');

    const formData = new FormData(visitForm);
    const customerName = customerNameInput.value.trim();
    const customer = customersMain.find(c => c.Customer_Name_AR === customerName);
    const customerCode = customer ? customer.Customer_Code : 'غير معروف'; // الحصول على الكود

    const selectedVisitType = visitTypeSelect.value;
    const isInventoryVisit = selectedVisitType === 'جرد استثنائي';

    const timestamp = new Date().toLocaleString('sv-SE'); // تنسيق للتوافقية
    const entryUserName = entryUserNameInput.value.trim(); // اسم الموظف المدخل

    let payload = {
        action: 'appendData',
        data: [],
        sheetName: ''
    };

    if (!isInventoryVisit) {
        // بيانات الزيارة العادية أو الزيارات المتعددة
        const visitEntries = document.querySelectorAll('.visit-entry');
        const visits = [];

        visitEntries.forEach((entry, index) => {
            const visitType = entry.querySelector('select[name="Visit_Type_Name_AR"]').value;
            const visitPurpose = entry.querySelector('select[name="Visit_Purpose"]').value;
            const visitOutcome = entry.querySelector('select[name="Visit_Outcome"]').value;
            const visitNotes = entry.querySelector('textarea[name="Visit_Notes"]').value;

            const productsInEntry = [];
            entry.querySelectorAll('.product-card').forEach(card => {
                const productCode = card.querySelector('.product-quantity-entry').dataset.productCode;
                const quantity = card.querySelector('.product-quantity-entry').value;
                const condition = card.querySelector(`input[name="entry-condition-${productCode}-${index + 1}"]:checked`).value; // استخدم index + 1 لمعرف الزيارة

                if (parseInt(quantity) > 0) {
                    const product = productsData.find(p => p.Product_Code === productCode);
                    if (product) {
                        productsInEntry.push({
                            Name: product.Product_Name_AR,
                            Code: product.Product_Code,
                            Quantity: Number(quantity),
                            Condition: condition
                        });
                    }
                }
            });

            const availableProducts = productsInEntry.filter(p => p.Condition === 'جيد').map(p => `${p.Name} (${p.Quantity})`).join(', ');
            const unavailableProducts = productsInEntry.filter(p => p.Condition === 'تالف').map(p => `${p.Name} (${p.Quantity})`).join(', ');


            visits.push({
                Visit_ID: `${visitGroupID}-${index + 1}`, // معرف فريد لكل زيارة
                Customer_Code: customerCode,
                Customer_Name_AR: customerName,
                Sales_Rep_Name_AR: salesRepNameSelect.value,
                Visit_Date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
                Visit_Time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                Visit_Purpose: visitPurpose,
                Visit_Outcome: visitOutcome,
                Visit_Type_Name_AR: visitType,
                Available_Products_Names: availableProducts,
                Unavailable_Products_Names: unavailableProducts,
                Entry_User_Name: entryUserName,
                Timestamp: timestamp,
                Customer_Type: customerTypeSelect.value,
                Notes: visitNotes || notesTextarea.value // ملاحظات الزيارة الفردية لها الأولوية، وإلا الملاحظات العامة
            });
        });

        payload.data = visits;
        payload.sheetName = 'Visit_Logs';

    } else {
        // بيانات الجرد الاستثنائي
        const items = [];
        document.querySelectorAll('.inventory-item').forEach((itemDiv, index) => {
            const productName = itemDiv.querySelector('input[name="Inventory_Product_Name"]').value;
            const product = inventoryProductsData.find(p => p.Product_Name_AR === productName);
            const quantity = itemDiv.querySelector('input[name="Inventory_Quantity"]').value;
            const expiration = itemDiv.querySelector('input[name="Expiration_Date"]').value;
            const unit = itemDiv.querySelector('select[name="Unit_Label"]').value;
            const notesValue = itemDiv.querySelector('textarea[name="Inventory_Notes"]').value;

            items.push({
                Inventory_ID: `${visitGroupID}-INV-${index + 1}`, // معرف فريد لعنصر الجرد
                Timestamp: timestamp,
                Entry_User_Name: entryUserName,
                Sales_Rep_Name_AR: salesRepNameSelect.value,
                Customer_Name_AR: customerName,
                Customer_Code: customerCode,
                Product_Name_AR: productName,
                Product_Code: product ? product.Product_Code : 'غير معروف', // إذا لم يتم العثور على المنتج
                Quantity: Number(quantity),
                Expiration_Date: expiration,
                Category: product ? product.Category : 'غير معروف',
                Package_Type: product ? product.Package_Type : 'غير معروف',
                Unit_Size: product ? product.Unit_Size : '',
                Unit_Label: unit,
                Notes: notesValue
            });
        });

        const consolidated = consolidateInventoryItems(items);
        payload.data = consolidated;
        payload.sheetName = 'Inventory_Logs';
    }

    try {
        const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // يتطلب هذا الوضع التعامل مع الاستجابة بشكل مختلف في بعض الحالات
            headers: { 'Content-Type': 'application/json' }, // على الرغم من no-cors، لا يزال يساعد الخادم على فهم المحتوى
            body: JSON.stringify(payload)
        });

        // بما أن mode: 'no-cors' لا يسمح بقراءة استجابة الخادم
        // سنفترض النجاح هنا ونعتمد على سجلات الخادم للمراقبة الدقيقة
        showSuccessMessage();
        visitForm.reset();
        clientVisitHistoryBox.classList.add('hidden');
        productsDisplayDiv.innerHTML = '';
        inventoryItemsContainer.innerHTML = '';
        visitEntriesContainer.innerHTML = '';
        addInventoryItem(); // إضافة حقل جرد أولي
        addVisitEntry(); // إضافة حقل زيارة أولي
        visitCounter = 0; // إعادة تعيين عداد الزيارات
        visitGroupID = `GROUP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`; // توليد معرف مجموعة جديد
        // لا حاجة لإعادة setupProductCategories هنا لأن loadAllData سيتم استدعاؤها في كل تحميل صفحة
    } catch (err) {
        console.error('خطأ أثناء الإرسال:', err);
        showErrorMessage('حدث خطأ أثناء إرسال البيانات: ' + err.message);
    } finally {
        submitBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
    }
}

// ---------------------------------------------------
// الأحداث عند تحميل الصفحة
// ---------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    loadAllData(); // تحميل جميع البيانات الأولية من ملفات JSON المحلية
    addInventoryItem(); // إضافة أول حقل لمنتج الجرد عند التحميل الأولي
    addVisitEntry(); // إضافة أول حقل لزيارة جديدة عند التحميل الأولي

    visitForm.addEventListener('submit', handleSubmit); // ربط دالة الإرسال بحدث submit للنموذج

    // ربط حدث التغيير لنوع الزيارة لتبديل الأقسام
    visitTypeSelect.addEventListener('change', (event) => {
        toggleVisitSections(event.target.value);
    });

    addInventoryItemBtn.addEventListener('click', addInventoryItem); // ربط زر إضافة منتج جرد

    // تفويض الأحداث لأزرار الحذف لمنتجات الجرد (لأنها تُضاف ديناميكياً)
    inventoryItemsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('removeInventoryItem')) {
            // السماح بالحذف فقط إذا كان هناك أكثر من عنصر جرد واحد
            if (inventoryItemsContainer.children.length > 1) {
                event.target.closest('.inventory-item').remove();
            } else {
                showWarningMessage('يجب أن يحتوي قسم الجرد على منتج واحد على الأقل.');
            }
        }
    });

    // تفويض الأحداث لأزرار الحذف لمدخلات الزيارة (لأنها تُضاف ديناميكياً)
    visitEntriesContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('removeVisitEntry')) {
            if (visitEntriesContainer.children.length > 1) {
                event.target.closest('.visit-entry').remove();
                visitCounter--; // إنقاص العداد عند الحذف
                // ملاحظة: قد تحتاج إلى إعادة ترقيم المعرفات إذا كان الترتيب مهمًا جداً، لكن لـ Visit_ID الفريد يكفي
            } else {
                showWarningMessage('يجب أن تحتوي الزيارات على مدخل زيارة واحد على الأقل.');
            }
        }
    });
});
