import semver from 'dummy/utils/semver';
import { module, test } from 'qunit';

module('Unit | Utility | semver', function() {
  // Replace this with your real tests.
  test('it works', function(assert) {
    assert.ok(semver("1.7.1", "1.7.10") < 0);
    assert.ok(semver("1.7.2", "1.7.10") < 0);
    assert.ok(semver("1.6.1", "1.7.10") < 0);
    assert.ok(semver("1.6.20", "1.7.10") < 0);
    assert.ok(semver("1.7.1", "1.7.10") < 0);
    assert.ok(semver("1.7", "1.7.0") < 0);
    assert.ok(semver("1.7", "1.8.0") < 0);

    assert.ok(semver("1.7.2", "1.7.10b", { lexicographical: true }) > 0);
    assert.ok(semver("1.7.10", "1.7.1") > 0);
    assert.ok(semver("1.7.10", "1.6.1") > 0);
    assert.ok(semver("1.7.10", "1.6.20") > 0);
    assert.ok(semver("1.7.0", "1.7") > 0);
    assert.ok(semver("1.8.0", "1.7") > 0);

    assert.ok(semver("1.7.10", "1.7.10") === 0);
    assert.ok(semver("1.7", "1.7") === 0);
    assert.ok(semver("1.7", "1.7.0", { zeroExtend: true }) === 0);

    assert.ok(isNaN(semver("1.7", "1..7")));
    assert.ok(isNaN(semver("1.7", "Bad")));
    assert.ok(isNaN(semver("1..7", "1.7")));
    assert.ok(isNaN(semver("Bad", "1.7")));
  });
});
