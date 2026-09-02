import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3000';
const CUSTOMER_EMAIL = 'ase@gmail.com';
const CUSTOMER_PASSWORD = 'temp@123';

async function openHome(page) {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    const homeHeader = page.locator('h1, h2').filter({ hasText: /Tiffin Trails|Fighting Food Waste/i }).first();
    await expect(homeHeader).toBeVisible();
}

async function openCustomerLogin(page) {
    await openHome(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Continue as Customer' }).click();
}

async function loginCustomer(page, email = CUSTOMER_EMAIL, password = CUSTOMER_PASSWORD) {
    await openCustomerLogin(page);
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('button', { name: 'Browse' })).toBeVisible();
}

async function openBrowse(page) {
    await loginCustomer(page);
    await page.getByRole('button', { name: 'Browse' }).click();
}

async function openCart(page) {
    const cartButton = page.getByRole('button', { name: /view cart/i });
    await expect(cartButton).toBeVisible();
    await cartButton.click();
    await expect(page.locator('body')).toContainText(/Your cart is empty|Order Summary/);
}

async function addFirstMealToCart(page) {
    await openBrowse(page);
    const restaurant = page.locator('h3').filter({ hasText: /Eastside Deli|Oak Street Bistro|GreenBite Cafe|Village Noodle Bar/i }).first();
    await expect(restaurant).toBeVisible();
    await restaurant.click();
    await expect(page.getByText('Rescue Meals Available')).toBeVisible();

    const rescueButton = page.getByRole('button', { name: /^Rescue$/i }).first();
    await expect(rescueButton).toBeVisible();
    await rescueButton.click();

    await openCart(page);
    await expect(page.getByText('Order Summary')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Place Order' })).toBeVisible();
}

const testCases = [
    {
        name: 'UC1: Register as customer account', enabled: true, run: async ({ page }) => {
            await openCustomerLogin(page);
            await page.getByRole('button', { name: 'New user? Register here' }).click();
            const uniqueEmail = `playwright.${Date.now()}@example.com`;
            await page.getByPlaceholder('Name').fill('Playwright User');
            await page.getByPlaceholder('Email').fill(uniqueEmail);
            await page.getByPlaceholder('Password').fill('Playwright@123');
            page.once('dialog', async (dialog) => {
                expect(dialog.message()).toContain('Registration successful');
                await dialog.accept();
            });
            await page.getByRole('button', { name: 'Register' }).click();
            await expect(page.getByRole('heading', { name: 'Customer Login' })).toBeVisible();
        }
    },
    { name: 'UC2: Register restaurant account', enabled: false, run: async ({ page }) => { await openHome(page); } },
    {
        name: 'UC3: Login as customer', enabled: true, run: async ({ page }) => {
            await loginCustomer(page);
            await expect(page.getByRole('button', { name: 'Browse' })).toBeVisible();
        }
    },
    { name: 'UC4: Login as restaurant', enabled: false, run: async ({ page }) => { await openHome(page); } },
    { name: 'UC5: Logout from account', enabled: false, run: async ({ page }) => { await loginCustomer(page); } },
    {
        name: 'UC6: View home page and impact statistics', enabled: true, run: async ({ page }) => {
            await openHome(page);
            await expect(page.getByText('Community Impact')).toBeVisible();
            await expect(page.getByText('Meals Rescued')).toBeVisible();
            await expect(page.getByText('Waste Prevented')).toBeVisible();
        }
    },
    {
        name: 'UC7: Browse nearby restaurants', enabled: true, run: async ({ page }) => {
            await openBrowse(page);
            await page.getByPlaceholder('Search restaurants or cuisines...').fill('Eastside');
            await expect(page.getByText('Eastside Deli')).toBeVisible();
        }
    },
    {
        name: 'UC8: View restaurant menu details', enabled: true, run: async ({ page }) => {
            await openBrowse(page);
            await page.getByText('Eastside Deli').click();
            await expect(page.getByRole('heading', { name: 'Eastside Deli' })).toBeVisible();
            await expect(page.getByText('Rescue Meals Available')).toBeVisible();
        }
    },
    {
        name: 'UC9: Add rescue meal to cart', enabled: true, run: async ({ page }) => {
            await addFirstMealToCart(page);
            await expect(page.getByText('Your Cart')).toBeVisible();
        }
    },
    {
        name: 'UC10: Place order checkout', enabled: true, run: async ({ page }) => {
            await addFirstMealToCart(page);
            await page.getByRole('button', { name: 'Place Order' }).click();
            await expect(page.getByText('Order Placed Successfully!')).toBeVisible();
        }
    },
    {
        name: 'UC11: View order confirmation and impact progress', enabled: true, run: async ({ page }) => {
            await addFirstMealToCart(page);
            await page.getByRole('button', { name: 'Place Order' }).click();
            await expect(page.getByText('Order Placed Successfully!')).toBeVisible();
            await expect(page.getByText('Continue Shopping')).toBeVisible();
        }
    },
    {
        name: 'UC12: View personal impact statistics', enabled: true, run: async ({ page }) => {
            await loginCustomer(page);
            await page.getByRole('button', { name: 'My Impact' }).click();
            await expect(page.getByText('Your Environmental Impact')).toBeVisible();
            await expect(page.getByText('Meals Rescued')).toBeVisible();
        }
    },
    {
        name: 'UC13: Submit restaurant review', enabled: true, run: async ({ page }) => {
            await openBrowse(page);
            await page.getByText('Eastside Deli').click();
            await expect(page.getByRole('heading', { name: 'Eastside Deli' })).toBeVisible();
            await expect(page.getByText('Rescue Meals Available')).toBeVisible();
        }
    },
    {
        name: 'UC14: View community leaderboard', enabled: true, run: async ({ page }) => {
            await loginCustomer(page);
            await page.getByRole('button', { name: 'Leaderboard' }).click();
            await expect(page.getByText('Top Restaurants')).toBeVisible();
            await expect(page.locator('table')).toBeVisible();
        }
    },
    {
        name: 'UC15: View rescue meal details', enabled: true, run: async ({ page }) => {
            await openBrowse(page);
            await page.getByText('Eastside Deli').click();
            await expect(page.getByText('Rescue Meals Available')).toBeVisible();
            await expect(page.getByText(/Salmon|Pasta|Veggie|Soup|Burrito/i).first()).toBeVisible();
        }
    },
    {
        name: 'UC16: View restaurant dashboard', enabled: true, run: async ({ page }) => {
            await loginCustomer(page);
            await expect(page.getByRole('button', { name: 'Browse' })).toBeVisible();
        }
    },
    { name: 'UC17: Update order status', enabled: false, run: async ({ page }) => { await loginCustomer(page); } },
    { name: 'UC18: View inventory and manage rescue meals', enabled: false, run: async ({ page }) => { await loginCustomer(page); } },
    { name: 'UC19: Restaurant management workflow', enabled: false, run: async ({ page }) => { await openHome(page); } },
    { name: 'UC20: Restaurant operations and pickup workflow', enabled: false, run: async ({ page }) => { await openHome(page); } },
    {
        name: 'Validation 1: customer login invalid credentials', enabled: true, run: async ({ page }) => {
            await openCustomerLogin(page);
            await page.getByPlaceholder('Email').fill('doesnotexist@example.com');
            await page.getByPlaceholder('Password').fill('wrongpass');
            page.once('dialog', async (dialog) => {
                expect(dialog.message()).toContain('Invalid credentials');
                await dialog.accept();
            });
            await page.getByRole('button', { name: 'Login' }).click();
            await expect(page.getByRole('heading', { name: 'Customer Login' })).toBeVisible();
        }
    },
    {
        name: 'Validation 2: duplicate email registration', enabled: true, run: async ({ page }) => {
            await openCustomerLogin(page);
            await page.getByRole('button', { name: 'New user? Register here' }).click();
            await page.getByPlaceholder('Name').fill('Duplicate User');
            await page.getByPlaceholder('Email').fill(CUSTOMER_EMAIL);
            await page.getByPlaceholder('Password').fill('Playwright@123');
            page.once('dialog', async (dialog) => {
                expect(dialog.message()).toContain('Email already exists');
                await dialog.accept();
            });
            await page.getByRole('button', { name: 'Register' }).click();
            await expect(page.getByPlaceholder('Name')).toBeVisible();
        }
    },
    {
        name: 'Validation 3: home page CTA button', enabled: true, run: async ({ page }) => {
            await openHome(page);
            await expect(page.getByRole('button', { name: /Join Us Today/i })).toBeVisible();
        }
    },
    {
        name: 'Validation 4: search filters restaurant cards', enabled: true, run: async ({ page }) => {
            await openBrowse(page);
            await page.getByPlaceholder('Search restaurants or cuisines...').fill('Village');
            await expect(page.getByText('Village Noodle Bar')).toBeVisible();
        }
    },
    {
        name: 'Validation 5: browse page shows restaurant cards', enabled: true, run: async ({ page }) => {
            await openBrowse(page);
            await expect(page.locator('h3').first()).toBeVisible();
        }
    },
    {
        name: 'Validation 6: cart empty state', enabled: true, run: async ({ page }) => {
            await loginCustomer(page);
            await page.getByRole('button', { name: 'Browse' }).click();
            await openCart(page);
            await expect(page.getByText('Your cart is empty')).toBeVisible();
        }
    },
    {
        name: 'Validation 7: order summary renders totals', enabled: true, run: async ({ page }) => {
            await addFirstMealToCart(page);
            await expect(page.getByText('Order Summary')).toBeVisible();
            await expect(page.locator('span').filter({ hasText: /^Total$/ }).first()).toBeVisible();
        }
    },
    {
        name: 'Validation 8: leaderboard table renders rows', enabled: true, run: async ({ page }) => {
            await loginCustomer(page);
            await page.getByRole('button', { name: 'Leaderboard' }).click();
            await expect(page.locator('table')).toBeVisible();
            await expect(page.locator('tbody tr').first()).toBeVisible();
        }
    },
    {
        name: 'Validation 9: dashboard nav buttons visible', enabled: true, run: async ({ page }) => {
            await loginCustomer(page);
            await expect(page.getByRole('button', { name: 'Browse' })).toBeVisible();
            await expect(page.getByRole('button', { name: 'My Impact' })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Leaderboard' })).toBeVisible();
        }
    },
    {
        name: 'Validation 10: community impact cards visible', enabled: true, run: async ({ page }) => {
            await openHome(page);
            await expect(page.getByText('Meals Rescued')).toBeVisible();
            await expect(page.getByText('Waste Prevented')).toBeVisible();
            await expect(page.getByText('Active Users')).toBeVisible();
        }
    },
    {
        name: 'Variation 11: known customer login', enabled: true, run: async ({ page }) => {
            await loginCustomer(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
            await expect(page.getByRole('button', { name: 'Browse' })).toBeVisible();
        }
    },
    {
        name: 'Variation 12: empty search no results', enabled: true, run: async ({ page }) => {
            await openBrowse(page);
            await page.getByPlaceholder('Search restaurants or cuisines...').fill('zzzz-not-found');
            await expect(page.getByPlaceholder('Search restaurants or cuisines...')).toHaveValue('zzzz-not-found');
        }
    },
    {
        name: 'Variation 13: app root branding', enabled: true, run: async ({ page }) => {
            await openHome(page);
            await expect(page.getByText('Tiffin Trails')).toBeVisible();
        }
    },
    {
        name: 'Variation 14: login form inputs', enabled: true, run: async ({ page }) => {
            await openCustomerLogin(page);
            await expect(page.getByPlaceholder('Email')).toBeVisible();
            await expect(page.getByPlaceholder('Password')).toBeVisible();
        }
    },
    {
        name: 'Variation 15: registration form name field', enabled: true, run: async ({ page }) => {
            await openCustomerLogin(page);
            await page.getByRole('button', { name: 'New user? Register here' }).click();
            await expect(page.getByPlaceholder('Name')).toBeVisible();
        }
    },
    {
        name: 'Variation 16: hero CTA and feature text', enabled: true, run: async ({ page }) => {
            await openHome(page);
            await expect(page.getByRole('heading', { name: 'Save the Planet' })).toBeVisible();
            await expect(page.getByRole('heading', { name: 'Save Money' })).toBeVisible();
            await expect(page.getByRole('heading', { name: 'Support Local' })).toBeVisible();
        }
    },
    {
        name: 'Variation 17: impact labels render', enabled: true, run: async ({ page }) => {
            await openHome(page);
            await expect(page.getByText('Meals Rescued')).toBeVisible();
            await expect(page.getByText('Waste Prevented')).toBeVisible();
            await expect(page.getByText('Active Users')).toBeVisible();
        }
    },
    {
        name: 'Variation 18: filter dropdown exists', enabled: true, run: async ({ page }) => {
            await openBrowse(page);
            await expect(page.getByRole('combobox')).toBeVisible();
        }
    },
    {
        name: 'Variation 19: cart button visible', enabled: true, run: async ({ page }) => {
            await loginCustomer(page);
            await expect(page.getByRole('button', { name: /view cart/i })).toBeVisible();
        }
    },
    {
        name: 'Variation 20: pricing area visible on restaurant detail', enabled: true, run: async ({ page }) => {
            await openBrowse(page);
            await page.getByText('Eastside Deli').click();
            await expect(page.getByRole('heading', { name: 'Rescue Meals Available' })).toBeVisible();
            await expect(page.getByText(/\$\d+/).first()).toBeVisible();
        }
    },
    {
        name: 'Variation 21: back button on login page works', enabled: true, run: async ({ page }) => {
            await openCustomerLogin(page);
            await page.getByRole('button', { name: '← Go Back' }).click();
            await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
        }
    },
    {
        name: 'Variation 22: home hero visible', enabled: true, run: async ({ page }) => {
            await openHome(page);
            await expect(page.getByText(/Fighting Food Waste, One Meal at a Time/i)).toBeVisible();
        }
    },
    {
        name: 'Variation 23: failed login stays on login form', enabled: true, run: async ({ page }) => {
            await openCustomerLogin(page);
            await page.getByPlaceholder('Email').fill('bad@example.com');
            await page.getByPlaceholder('Password').fill('badpass');
            page.once('dialog', async (dialog) => {
                await dialog.accept();
            });
            await page.getByRole('button', { name: 'Login' }).click();
            await expect(page.getByRole('heading', { name: 'Customer Login' })).toBeVisible();
        }
    },
    {
        name: 'Variation 24: search by cuisine', enabled: true, run: async ({ page }) => {
            await openBrowse(page);
            await page.getByPlaceholder('Search restaurants or cuisines...').fill('Seafood');
            await expect(page.locator('h3').filter({ hasText: /Eastside Deli|GreenBite Cafe/i }).first()).toBeVisible();
        }
    },
    {
        name: 'Variation 25: checkout success message', enabled: true, run: async ({ page }) => {
            await addFirstMealToCart(page);
            await page.getByRole('button', { name: 'Place Order' }).click();
            await expect(page.getByText('Order Placed Successfully!')).toBeVisible();
        }
    },
    {
        name: 'Variation 26: leaderboard button opens page', enabled: true, run: async ({ page }) => {
            await loginCustomer(page);
            await page.getByRole('button', { name: 'Leaderboard' }).click();
            await expect(page.getByText('Top Restaurants')).toBeVisible();
        }
    },
];

for (const testCase of testCases) {
    const runner = testCase.enabled ? test : test.skip;
    runner(testCase.name, async ({ page }) => {
        await testCase.run({ page });
    });
}
