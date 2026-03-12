const http = require('http');

const BASE_URL = 'http://localhost:5000/api/v1';

async function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          console.error(`Error: GET ${url} returned status ${res.statusCode}`);
          console.error(`Response body: ${data.substring(0, 500)}`);
          resolve({ _isError: true, status: res.statusCode, data: null });
          return;
        }
        try {
          const parsed = JSON.parse(data);
          // Standardize response: if it's an array, wrap it.
          if (Array.isArray(parsed)) {
            resolve({ success: true, data: parsed, _raw: true });
          } else {
            resolve(parsed);
          }
        } catch (e) {
          console.error(`Failed to parse JSON from ${url}: ${e.message}`);
          console.error(`Response body: ${data.substring(0, 500)}`);
          resolve({ _isError: true, error: e.message, data: null });
        }
      });
    }).on('error', (err) => {
      console.error(`Connection error to ${url}: ${err.message}`);
      reject(err);
    });
  });
}

async function testSubcategories() {
  try {
    console.log('--- Subcategory Fetching Verification ---');
    
    // 1. Get header categories
    console.log('\n1. Fetching header categories...');
    const headerCats = await getJson(`${BASE_URL}/header-categories`);
    if (headerCats._isError || !headerCats.data || headerCats.data.length === 0) {
      console.log('No header categories found in active status or error occurred.');
    } else {
      console.log(`Found ${headerCats.data.length} header categories.`);
    }

    // 2. Fetch all subcategories so we can find a valid parent category
    console.log('\n2. Fetching all subcategories to pick a test case...');
    const allSubRes = await getJson(`${BASE_URL}/categories/subcategories`);
    if (allSubRes._isError || !allSubRes.data || allSubRes.data.length === 0) {
      console.log('No subcategories found in database.');
      return;
    }
    
    // Pick the first subcategory and use its parent
    const firstSub = allSubRes.data[0];
    const newModelCount = allSubRes.data.filter(s => s.isNewModel).length;
    const oldModelCount = allSubRes.data.filter(s => !s.isNewModel).length;
    console.log(`Found ${allSubRes.data.length} total subcategories (New Model: ${newModelCount}, Old Model: ${oldModelCount})`);
    
    // Get its parent category
    console.log(`First Subcategory object:`, JSON.stringify(firstSub, null, 2));
    
    // Fetch all categories to find the ID by name
    const catsRes = await getJson(`${BASE_URL}/customer/categories`);
    const parentCat = catsRes.data && catsRes.data.find(c => c.name === firstSub.categoryName);
    
    let catId = parentCat ? parentCat._id : null;
    console.log(`Extracted Parent Category ID: ${catId} (for name: ${firstSub.categoryName})`);
    
    if (!catId) {
      console.log('Could not determine parent category ID. Aborting.');
      return;
    }
    
    // Fetch parent category for slug
    const parentCatRes = await getJson(`${BASE_URL}/customer/categories/${catId}`);
    const catSlug = parentCatRes.data && parentCatRes.data.category ? parentCatRes.data.category.slug : catId;
    console.log(`Resolved Parent Slug: ${catSlug}`);

    // 3. Test Admin Subcategories API - SKIPPED (Requires token)
    console.log('\n3. Testing Admin Subcategories API (param: category)... [SKIPPED - Requires Admin Token]');
    // const adminRes = await getJson(`${BASE_URL}/admin/subcategories?category=${catId}`);

    // 4. Test Admin Subcategories API - SKIPPED
    console.log('\n4. Testing Admin Subcategories API (param: categoryId)... [SKIPPED - Requires Admin Token]');

    // 5. Test Seller Subcategories by Category Slug
    console.log('\n5. Testing Seller Subcategories by Slug...');
    const sellerResSlug = await getJson(`${BASE_URL}/categories/${catSlug}/subcategories`);
    console.log(`Success: ${sellerResSlug.success}, Count: ${sellerResSlug.data ? sellerResSlug.data.length : 0}`);
    if (sellerResSlug.data && sellerResSlug.data.length > 0) {
      console.log(`First subcategory: ${sellerResSlug.data[0].subcategoryName} (Model: ${sellerResSlug.data[0].isNewModel ? 'New/Hierarchical' : 'Old/Legacy'})`);
    }

    // 6. Test Seller Subcategories by Category ID
    console.log('\n6. Testing Seller Subcategories by ID...');
    const sellerResId = await getJson(`${BASE_URL}/categories/${catId}/subcategories`);
    console.log(`Success: ${sellerResId.success}, Count: ${sellerResId.data ? sellerResId.data.length : 0}`);

    // 7. Test All Subcategories
    console.log('\n7. Testing All Subcategories API...');
    const allRes = await getJson(`${BASE_URL}/categories/subcategories`);
    console.log(`Success: ${allRes.success}, Count: ${allRes.data ? allRes.data.length : 0}`);
    if (allRes.data && allRes.data.length > 0) {
       const newModelCount = allRes.data.filter(s => s.isNewModel).length;
       const oldModelCount = allRes.data.filter(s => !s.isNewModel).length;
       console.log(`Breakdown: ${newModelCount} from New Model, ${oldModelCount} from Old Model`);
    }

    console.log('\n--- Verification Complete ---');
  } catch (error) {
    console.error('Verification failed:', error.message);
  }
}

testSubcategories();
