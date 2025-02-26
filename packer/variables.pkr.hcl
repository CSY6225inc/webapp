# GCP config
variable "gcp_project_id" {
  type    = string
  default = "devproject-451800"
}

variable "gcp_zone" {
  type    = string
  default = "us-central1-a"
}

variable "gcp_source_image_family" {
  type    = string
  default = "ubuntu-2404-lts-amd64"
}
variable "gcp_image_name" {
  type    = string
  default = "csye6225-app-{{timestamp}}"
}
variable "gcp_image_family" {
  type    = string
  default = "csye6225-app"
}
variable "gcp_machine_type" {
  type    = string
  default = "e2-micro"
}
# AWS config
variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "aws_subnet_id" {
  type    = string
  default = "subnet-0601a52449572191c"
}

variable "aws_ami_filter_name" {
  type    = string
  default = "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"
}
variable "aws_ami_virtualization_type" {
  type    = string
  default = "hvm"
}
variable "aws_ami_name" {
  type    = string
  default = "ubuntu-24-node-{{timestamp}}"
}
variable "aws_instance_type" {
  type    = string
  default = "subnet-0601a52449572191c"
}
variable "aws_profile" {
  type    = string
  default = "dev"
}
variable "aws_device_name" {
  type    = string
  default = "/dev/sda1"
}
variable "aws_volume_size" {
  type    = number
  default = 25
}
variable "aws_volume_type" {
  type    = string
  default = "gp2"
}
# App related values to build artfiacts 
variable "application_artifact_path" {
  type    = string
  default = "../webapp-fork.zip"
}

variable "ssh_username" {
  type    = string
  default = "ubuntu"
}

variable "DB_PASSWORD" {
  type    = string
  default = ""
}

variable "DB_NAME" {
  type    = string
  default = ""
}
variable "DB_USER" {
  type    = string
  default = ""
}
