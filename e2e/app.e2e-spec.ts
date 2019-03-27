import { AngularElectronPage } from './app.po';
import { browser, element, by } from 'protractor';

describe('xels-core App', () => {
  let page: AngularElectronPage;

  beforeEach(() => {
    page = new AngularElectronPage();
  });

  it('Page title should be Xels Core', () => {
    page.navigateTo('/');
    expect(page.getTitle()).toEqual('Xels Core');
  });
});
