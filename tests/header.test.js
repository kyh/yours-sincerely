const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:5000');
});

afterEach(async () => {
  await page.close();
});

test('clicking login starts oauth flow', async () => {
  await page.click('.nav-link.login-button');

  const url = await page.url();

  expect(url).toMatch(/accounts\.google\.com/);
});

test('When signed in, shows logout button', async () => {
  await page.login();

  const text = await page.$eval('a[href="/auth/logout"]', (el) => el.innerHTML);

  expect(text).toEqual('Logout');
});
