import { Box, Center, Heading, Text, VStack } from '@gluestack-ui/themed';

export default function HomeScreen() {
  return (
    <Box flex={1} backgroundColor="$white">
      <Center flex={1}>
        <VStack space="sm" alignItems="center">
          <Heading size="2xl">Home</Heading>
          <Text color="$coolGray500">Your roommate dashboard</Text>
        </VStack>
      </Center>
    </Box>
  );
}
