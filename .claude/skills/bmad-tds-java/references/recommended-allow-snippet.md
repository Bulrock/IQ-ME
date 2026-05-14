# Java / JVM — recommended `.claude/settings.local.json` allow patterns

Copy-paste в свой `.claude/settings.local.json` (под `permissions.allow`)
чтобы pre-approve typical Java/Maven/Gradle dev-cycle commands. Patterns
— Claude Code prefix-matching, `*` в конце = «любые args».

```json
{
  "permissions": {
    "allow": [
      "Bash(mvn *)",
      "Bash(mvn clean *)",
      "Bash(mvn test *)",
      "Bash(mvn package *)",
      "Bash(mvn install *)",
      "Bash(mvn verify *)",
      "Bash(mvn dependency:*)",
      "Bash(./mvnw *)",
      "Bash(./mvnw)",
      "Bash(gradle *)",
      "Bash(./gradlew *)",
      "Bash(./gradlew test *)",
      "Bash(./gradlew build *)",
      "Bash(./gradlew bootRun *)",
      "Bash(./gradlew check *)",
      "Bash(./gradlew dependencies *)",
      "Bash(./gradlew)",
      "Bash(java --version)",
      "Bash(java -version)",
      "Bash(java -jar *)",
      "Bash(javac *)",
      "Bash(kotlin *)",
      "Bash(kotlinc *)"
    ]
  }
}
```

## Spring Boot dev shortcuts

```json
{
  "permissions": {
    "allow": [
      "Bash(./mvnw spring-boot:run *)",
      "Bash(./mvnw spring-boot:run)",
      "Bash(./gradlew bootRun)"
    ]
  }
}
```

## Известные ограничения

Claude Code permission engine — **strict prefix match**:

- Wildcards `*` работают **в конце** pattern'а или в command body
  (`mvn test *` matches `mvn test -Dtest=FooTest -DfailIfNoTests=false`).
- Wildcards в **середине / начале** не работают.
- **Compound chains** (`export JAVA_OPTS=... && ./gradlew test 2>&1 | tail`)
  каждая unique string. См. Шаг 4e в `bmad-tds-execute-story` SKILL.md —
  recommended избегать compound.

## Альтернатива: shell rc / direnv / sdkman

```sh
# .envrc (project-root)
export JAVA_HOME="$(/usr/libexec/java_home -v 21)"
export GRADLE_OPTS="-Xmx4g"
export MAVEN_OPTS="-Xmx2g"
```

`sdkman` автоматически переключает JDK по `.sdkmanrc`. После `direnv
allow` команды standalone match'ят pre-allowed patterns.
