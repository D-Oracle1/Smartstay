import { Module } from '@nestjs/common';

@Module({})
export class $(echo $module | sed 's/-//g' | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')Module {}
