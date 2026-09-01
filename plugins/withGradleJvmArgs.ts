import {
	AndroidConfig,
	type ConfigPlugin,
	withGradleProperties,
} from "expo/config-plugins";

const PROPERTY_NAME = "org.gradle.jvmargs";

type GradleJvmArgsOptions = {
	value: string;
};

const withGradleJvmArgs: ConfigPlugin<GradleJvmArgsOptions> = (
	config,
	options,
) => {
	const value = options?.value.trim();

	if (!value) {
		throw new Error("withGradleJvmArgs requires a non-empty value");
	}

	return withGradleProperties(config, (modConfig) => {
		modConfig.modResults =
			AndroidConfig.BuildProperties.updateAndroidBuildProperty(
				modConfig.modResults,
				PROPERTY_NAME,
				value,
			);

		return modConfig;
	});
};

export default withGradleJvmArgs;
