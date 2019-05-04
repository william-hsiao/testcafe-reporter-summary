export default function () {
    return {
        currentFixture: null,

        report: {
            startTime:  null,
            endTime:    null,
            userAgents: null,
            passed:     0,
            total:      0,
            skipped:    0,
            fixtures:   [],
            warnings:   []
        },

        _formatScore (report) {
            var score = `${this.chalk.green(`${report.passed} passed`)}`;

            if (report.skipped)
                score += `, ${this.chalk.yellow(`${report.skipped} skipped`)}`;
            if (report.passed !== report.total)
                score += `, ${this.chalk.red(`${report.total - report.passed} failed`)}`;

            return score;
        },

        reportTaskStart (startTime, userAgents, testCount) {
            this.report.startTime  = startTime;
            this.report.userAgents = userAgents;
            this.report.total      = testCount;

            this.useWordWrap(true)
                .setIndent(1)
                .newline()
                .write(this.chalk.bold('Running tests in:'))
                .write(this.chalk.blue(this.report.userAgents.join(', ')))
                .newline();
        },

        reportFixtureStart (name, path) {
            this.currentFixture = {
                name,
                path,
                passed:  0,
                total:   0,
                skipped: 0,
                tests:   []
            };
            this.report.fixtures.push(this.currentFixture);
        },

        reportTestDone (name, testRunInfo) {
            if (testRunInfo.skipped) {
                this.currentFixture.skipped++;
                this.report.skipped++;
            } else if (!testRunInfo.errs.length)
                this.currentFixture.passed++;

            this.currentFixture.total++;
            this.currentFixture.tests.push({
                name,

                errs:           testRunInfo.errs,
                durationMs:     testRunInfo.durationMs,
                unstable:       testRunInfo.unstable,
                screenshotPath: testRunInfo.screenshotPath,
                skipped:        testRunInfo.skipped
            });
        },

        reportTaskDone (endTime, passed, warnings) {
            this.report.passed   = passed;
            this.report.endTime  = endTime;
            this.report.warnings = warnings;

            this.newline()
                .write(this.chalk.bold('Test Results'))
                .write(`(${this.chalk.blue(`${this.report.userAgents.join(', ')}`)})`)
                .newline().newline();

            if (this.report.passed !== this.report.total) {
                this.write(this.chalk.bold('Errors:'))
                    .newline();

                this.report.fixtures.forEach(fixture => {
                    fixture.tests.forEach(test => {
                        const hasErr = !!test.errs.length;
                        
                        if (hasErr) {
                            this.write(this.chalk.bold(this.chalk.red(`${fixture.name} - ${test.name} (path: "${fixture.path}")`)))
                            .newline().newline();
                            test.errs.forEach((err, idx) => {
                                this.write(this.formatError(err, `${idx + 1}) `));
                            });
                        }
    
                        this.newline();
                    });
                });
                this.newline().newline();
            }

            if (this.report.warnings.length) {
                this.write(this.chalk.bold('Warnings: ')).newline();
                this.report.warnings.forEach(warning => {
                    this.write(this.chalk.yellow(warning)).newline();
                });
                this.newline();
            }
            
            this.newline().write(this.chalk.bold('Summary: ')).newline();

            this.report.fixtures.forEach(fixture => {
                var score = `(${this._formatScore(fixture)})`;

                if (fixture.passed === fixture.total)
                    this.write(this.chalk.green(this.symbols.ok));
                else if (fixture.passed + fixture.skipped === fixture.total)
                    this.write(this.chalk.yellow(this.symbols.ok));
                else
                    this.write(this.chalk.red(this.symbols.err));
                
                this.useWordWrap(true).write(`${fixture.name} ${score}`).newline();
            });

            var totalScore = this._formatScore(this.report);
            var durationStr = this.moment.duration(this.report.endTime - this.report.startTime).format('h[h] mm[m] ss[s]');

            this.newline()
                .write(`Total Score: ${totalScore}`)
                .newline()
                .write(`Test Duration: ${durationStr}`)
                .newline().newline();
        }
    };
}
